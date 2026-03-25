import express from "express";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "recipe_hub_super_secret_key_2026";

// Ping route for checking server status without DB dependency
app.get("/api/ping", (req, res) => res.json({ status: "pong", env: process.env.NODE_ENV }));

// Middleware
app.use(cors());
// Explicitly handle body parsing for Vercel serverless environment
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {}
  }
  next();
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Create uploads directory (safe for serverless)
const uploadsDir = path.join(__dirname, "uploads");
try {
  if (!fs.existsSync(uploadsDir) && !process.env.VERCEL) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.log("Uploads dir skip (Normal for serverless/read-only)");
}

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });
const recipeUpload = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "video_file", maxCount: 1 },
]);

// PostgreSQL connection
if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production" && process.env.VERCEL) {
  console.error("⚠️ DATABASE_URL is missing in production environment!");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/recipe_hub",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Test database connection
pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle client", err);
});

try {
  pool.query("SELECT NOW()", (err, result) => {
    if (err) {
      console.error("❌ Database connection check failed:", err.message);
    } else {
      console.log("✅ Database connected successfully");
    }
  });
} catch (err) {
  console.error("❌ Synchronous error checking database:", err.message);
}

// Initialize database tables
async function initDB() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not defined in environment variables");
    return;
  }

  let client;
  try {
    client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        mobile VARCHAR(20),
        gender VARCHAR(20),
        age INTEGER,
        profile_photo TEXT,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS recipes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        ingredients TEXT,
        instructions TEXT,
        category VARCHAR(100),
        cuisine VARCHAR(100),
        cook_time VARCHAR(50),
        servings VARCHAR(50),
        difficulty VARCHAR(50),
        thumbnail TEXT,
        video_url TEXT,
        video_file TEXT,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add video_file column if it doesn't exist (for existing tables)
    await client.query(`
      ALTER TABLE recipes ADD COLUMN IF NOT EXISTS video_file TEXT;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS recipe_likes (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(recipe_id, user_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS recipe_views (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(recipe_id, user_id)
      );
    `);

    // Create default admin account
    const adminCheck = await client.query(
      "SELECT * FROM users WHERE email = 'admin@recipehub.com'",
    );
    if (adminCheck.rows.length === 0) {
      const hashedPw = await bcrypt.hash("admin123", 10);
      await client.query(
        "INSERT INTO users (name, email, password, mobile, gender, age, role) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [
          "Admin",
          "admin@recipehub.com",
          hashedPw,
          "9999999999",
          "Other",
          30,
          "admin",
        ],
      );
      console.log("✅ Default admin created: admin@recipehub.com / admin123");
    }

    console.log("✅ Database tables initialized");
  } catch (err) {
    console.error("❌ DB init error:", err.message);
  } finally {
    if (client) client.release();
  }
}

// Call initDB but catch errors to prevent crashing the server
initDB().catch(err => {
  console.error("❌ Fatal DB init error:", err.message);
});

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Admin only" });
  next();
}

// ============ HEALTH CHECK ROUTE ============
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "ok",
      database: "connected",
      timestamp: result.rows[0].now,
      message: "Server and database are working correctly",
    });
  } catch (err) {
    res.status(503).json({
      status: "error",
      database: "disconnected",
      error: err.message,
      message: "Database connection failed",
    });
  }
});

// ============ AUTH ROUTES ============

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, mobile, gender, age } = req.body;
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0)
      return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password, mobile, gender, age) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role",
      [name, email, hashedPassword, mobile, gender, age],
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  console.log(`📡 Login attempt for: ${req.body?.email}`);
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      console.log("❌ Login failed: Missing email or password");
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Query the database
    let result;
    try {
      result = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
    } catch (dbErr) {
      console.error("❌ Database query error:", dbErr.message);
      return res
        .status(503)
        .json({ error: "Database connection failed. Please try again later." });
    }

    if (result.rows.length === 0) {
      console.log(`❌ Login failed: User ${email} not found`);
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Check if password hash exists
    if (!user.password) {
      console.log(`❌ Login failed: No password hash for ${email}`);
      return res
        .status(500)
        .json({ error: "User account error - please contact support" });
    }

    let valid;
    try {
      valid = await bcrypt.compare(password, user.password);
    } catch (bcryptErr) {
      console.error("❌ Bcrypt error:", bcryptErr.message);
      return res
        .status(500)
        .json({ error: "Password verification error - please try again" });
    }

    if (!valid) {
      console.log(`❌ Login failed: Invalid password for ${email}`);
      return res.status(400).json({ error: "Invalid credentials" });
    }

    try {
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: "7d" },
      );
      console.log(`✅ Login successful for: ${email}`);
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      });
    } catch (jwtErr) {
      console.error("❌ JWT error:", jwtErr.message);
      return res
        .status(500)
        .json({ error: "Token generation error - please try again" });
    }
  } catch (err) {
    console.error("❌ Unexpected login error:", err);
    res
      .status(500)
      .json({
        error: "An unexpected server error occurred. Please try again later.",
      });
  }
});

// ============ USER PROFILE ROUTES ============

// Get profile
app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, mobile, gender, age, profile_photo, role, created_at FROM users WHERE id = $1",
      [req.user.id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
app.put(
  "/api/profile",
  authMiddleware,
  upload.single("profile_photo"),
  async (req, res) => {
    try {
      const { name, mobile, gender, age, password } = req.body;
      let photoPath = null;
      if (req.file) {
        photoPath = "/uploads/" + req.file.filename;
      }

      let query = "UPDATE users SET name=$1, mobile=$2, gender=$3, age=$4";
      let params = [name, mobile, gender, age];
      let paramIndex = 5;

      if (photoPath) {
        query += `, profile_photo=$${paramIndex}`;
        params.push(photoPath);
        paramIndex++;
      }
      if (password && password.trim() !== "") {
        const hashedPassword = await bcrypt.hash(password, 10);
        query += `, password=$${paramIndex}`;
        params.push(hashedPassword);
        paramIndex++;
      }

      query += ` WHERE id=$${paramIndex} RETURNING id, name, email, mobile, gender, age, profile_photo, role`;
      params.push(req.user.id);

      const result = await pool.query(query, params);
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ============ RECIPE ROUTES ============

// Create recipe
app.post("/api/recipes", authMiddleware, recipeUpload, async (req, res) => {
  try {
    const {
      title,
      description,
      ingredients,
      instructions,
      category,
      cuisine,
      cook_time,
      servings,
      difficulty,
      video_url,
    } = req.body;
    let thumbnailPath = null;
    let videoFilePath = null;
    if (req.files?.thumbnail?.[0]) {
      thumbnailPath = "/uploads/" + req.files.thumbnail[0].filename;
    }
    if (video_url && video_url.trim() !== "") {
      videoFilePath = null;
    } else if (req.files?.video_file?.[0]) {
      videoFilePath = "/uploads/" + req.files.video_file[0].filename;
    }
    const result = await pool.query(
      `INSERT INTO recipes (user_id, title, description, ingredients, instructions, category, cuisine, cook_time, servings, difficulty, thumbnail, video_url, video_file)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        req.user.id,
        title,
        description,
        ingredients,
        instructions,
        category,
        cuisine,
        cook_time,
        servings,
        difficulty,
        thumbnailPath,
        video_url,
        videoFilePath,
      ],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all recipes (with optional search)
app.get("/api/recipes", async (req, res) => {
  try {
    const { search, category, cuisine, page = 1, limit = 12 } = req.query;
    let query = `SELECT r.*, 
                 (SELECT COUNT(*) FROM recipe_views WHERE recipe_id = r.id) as views,
                 u.name as author_name, u.profile_photo as author_photo 
                 FROM recipes r JOIN users u ON r.user_id = u.id WHERE 1=1`;
    let params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (LOWER(r.title) LIKE $${paramIndex} OR LOWER(r.description) LIKE $${paramIndex} OR LOWER(r.ingredients) LIKE $${paramIndex} OR LOWER(r.cuisine) LIKE $${paramIndex} OR LOWER(r.category) LIKE $${paramIndex})`;
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }
    if (category) {
      query += ` AND LOWER(r.category) = $${paramIndex}`;
      params.push(category.toLowerCase());
      paramIndex++;
    }
    if (cuisine) {
      query += ` AND LOWER(r.cuisine) = $${paramIndex}`;
      params.push(cuisine.toLowerCase());
      paramIndex++;
    }

    query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = "SELECT COUNT(*) FROM recipes r WHERE 1=1";
    let countParams = [];
    let cParamIndex = 1;
    if (search) {
      countQuery += ` AND (LOWER(r.title) LIKE $${cParamIndex} OR LOWER(r.description) LIKE $${cParamIndex})`;
      countParams.push(`%${search.toLowerCase()}%`);
      cParamIndex++;
    }
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      recipes: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search suggestions
app.get("/api/recipes/suggestions", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const result = await pool.query(
      `SELECT DISTINCT title, category, cuisine FROM recipes 
       WHERE LOWER(title) LIKE $1 OR LOWER(category) LIKE $1 OR LOWER(cuisine) LIKE $1 
       LIMIT 10`,
      [`%${q.toLowerCase()}%`],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single recipe
app.get("/api/recipes/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, 
       (SELECT COUNT(*) FROM recipe_views WHERE recipe_id = r.id) as views,
       u.name as author_name, u.profile_photo as author_photo, u.email as author_email
       FROM recipes r JOIN users u ON r.user_id = u.id WHERE r.id = $1`,
      [req.params.id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Recipe not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record unique view
app.post("/api/recipes/:id/view", authMiddleware, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;

    // Check if viewed before
    const check = await pool.query(
      "SELECT * FROM recipe_views WHERE recipe_id=$1 AND user_id=$2",
      [recipeId, userId],
    );

    if (check.rows.length === 0) {
      await pool.query(
        "INSERT INTO recipe_views (recipe_id, user_id) VALUES ($1, $2)",
        [recipeId, userId],
      );
      await pool.query("UPDATE recipes SET views = views + 1 WHERE id = $1", [
        recipeId,
      ]);
      return res.json({ viewed: true, message: "Unique view recorded" });
    }

    res.json({ viewed: false, message: "Already viewed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update recipe
app.put("/api/recipes/:id", authMiddleware, recipeUpload, async (req, res) => {
  try {
    const {
      title,
      description,
      ingredients,
      instructions,
      category,
      cuisine,
      cook_time,
      servings,
      difficulty,
      video_url,
    } = req.body;

    // Check ownership or admin
    const existing = await pool.query("SELECT * FROM recipes WHERE id = $1", [
      req.params.id,
    ]);
    if (existing.rows.length === 0)
      return res.status(404).json({ error: "Recipe not found" });
    if (existing.rows[0].user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    let thumbnailPath = existing.rows[0].thumbnail;
    let videoFilePath = existing.rows[0].video_file;

    if (req.files?.thumbnail?.[0]) {
      thumbnailPath = "/uploads/" + req.files.thumbnail[0].filename;
    }

    if (video_url && video_url.trim() !== "") {
      // If YouTube URL is provided, clear the local video file
      videoFilePath = null;
    } else if (req.files?.video_file?.[0]) {
      // If new video file is uploaded, use it (assumes video_url is cleared by frontend)
      videoFilePath = "/uploads/" + req.files.video_file[0].filename;
    }

    const result = await pool.query(
      `UPDATE recipes SET title=$1, description=$2, ingredients=$3, instructions=$4, 
       category=$5, cuisine=$6, cook_time=$7, servings=$8, difficulty=$9, thumbnail=$10, 
       video_url=$11, video_file=$12, updated_at=CURRENT_TIMESTAMP WHERE id=$13 RETURNING *`,
      [
        title,
        description,
        ingredients,
        instructions,
        category,
        cuisine,
        cook_time,
        servings,
        difficulty,
        thumbnailPath,
        video_url,
        videoFilePath,
        req.params.id,
      ],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete recipe
app.delete("/api/recipes/:id", authMiddleware, async (req, res) => {
  try {
    const existing = await pool.query("SELECT * FROM recipes WHERE id = $1", [
      req.params.id,
    ]);
    if (existing.rows.length === 0)
      return res.status(404).json({ error: "Recipe not found" });
    if (existing.rows[0].user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    await pool.query("DELETE FROM recipes WHERE id = $1", [req.params.id]);
    res.json({ message: "Recipe deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like recipe
app.post("/api/recipes/:id/like", authMiddleware, async (req, res) => {
  try {
    const existing = await pool.query(
      "SELECT * FROM recipe_likes WHERE recipe_id=$1 AND user_id=$2",
      [req.params.id, req.user.id],
    );
    if (existing.rows.length > 0) {
      await pool.query(
        "DELETE FROM recipe_likes WHERE recipe_id=$1 AND user_id=$2",
        [req.params.id, req.user.id],
      );
      await pool.query("UPDATE recipes SET likes = likes - 1 WHERE id = $1", [
        req.params.id,
      ]);
      return res.json({ liked: false });
    }
    await pool.query(
      "INSERT INTO recipe_likes (recipe_id, user_id) VALUES ($1, $2)",
      [req.params.id, req.user.id],
    );
    await pool.query("UPDATE recipes SET likes = likes + 1 WHERE id = $1", [
      req.params.id,
    ]);
    res.json({ liked: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ DASHBOARD / ANALYTICS ============

// User dashboard stats
app.get("/api/dashboard/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const totalRecipes = await pool.query(
      "SELECT COUNT(*) FROM recipes WHERE user_id = $1",
      [userId],
    );
    const totalViews = await pool.query(
      "SELECT COUNT(*) FROM recipe_views WHERE recipe_id IN (SELECT id FROM recipes WHERE user_id = $1)",
      [userId],
    );
    const totalLikes = await pool.query(
      "SELECT COALESCE(SUM(likes), 0) as total FROM recipes WHERE user_id = $1",
      [userId],
    );
    const recentRecipes = await pool.query(
      "SELECT * FROM recipes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5",
      [userId],
    );

    // Category distribution
    const categoryDist = await pool.query(
      "SELECT category, COUNT(*) as count FROM recipes WHERE user_id = $1 AND category IS NOT NULL GROUP BY category",
      [userId],
    );

    // Monthly uploads (last 6 months)
    const monthlyUploads = await pool.query(
      `
      SELECT TO_CHAR(created_at, 'Mon YYYY') as month, COUNT(*) as count 
      FROM recipes WHERE user_id = $1 AND created_at > NOW() - INTERVAL '6 months' 
      GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `,
      [userId],
    );

    res.json({
      totalRecipes: parseInt(totalRecipes.rows[0].count),
      totalViews: parseInt(totalViews.rows[0].total),
      totalLikes: parseInt(totalLikes.rows[0].total),
      recentRecipes: recentRecipes.rows,
      categoryDistribution: categoryDist.rows,
      monthlyUploads: monthlyUploads.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin stats
app.get(
  "/api/admin/stats",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const totalUsers = await pool.query("SELECT COUNT(*) FROM users");
      const totalRecipes = await pool.query("SELECT COUNT(*) FROM recipes");
      const totalViews = await pool.query(
        "SELECT COALESCE(SUM(views), 0) as total FROM recipes",
      );
      const totalLikes = await pool.query(
        "SELECT COALESCE(SUM(likes), 0) as total FROM recipes",
      );

      const topRecipes = await pool.query(`
      SELECT r.*, u.name as author_name FROM recipes r JOIN users u ON r.user_id = u.id 
      ORDER BY r.views DESC LIMIT 10
    `);

      const topUsers = await pool.query(`
      SELECT u.id, u.name, u.email, u.profile_photo, COUNT(r.id) as recipe_count, 
      COALESCE(SUM(r.views), 0) as total_views
      FROM users u LEFT JOIN recipes r ON u.id = r.user_id 
      GROUP BY u.id, u.name, u.email, u.profile_photo
      ORDER BY recipe_count DESC LIMIT 10
    `);

      const categoryDist = await pool.query(
        "SELECT category, COUNT(*) as count FROM recipes WHERE category IS NOT NULL GROUP BY category ORDER BY count DESC",
      );

      const monthlyUploads = await pool.query(`
      SELECT TO_CHAR(created_at, 'Mon YYYY') as month, COUNT(*) as count 
      FROM recipes WHERE created_at > NOW() - INTERVAL '6 months' 
      GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);

      const recentUsers = await pool.query(
        "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10",
      );

      res.json({
        totalUsers: parseInt(totalUsers.rows[0].count),
        totalRecipes: parseInt(totalRecipes.rows[0].count),
        totalViews: parseInt(totalViews.rows[0].total),
        totalLikes: parseInt(totalLikes.rows[0].total),
        topRecipes: topRecipes.rows,
        topUsers: topUsers.rows,
        categoryDistribution: categoryDist.rows,
        monthlyUploads: monthlyUploads.rows,
        recentUsers: recentUsers.rows,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// Admin: Get all users
app.get(
  "/api/admin/users",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT id, name, email, mobile, gender, age, profile_photo, role, created_at FROM users ORDER BY created_at DESC",
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// Admin: Delete user
app.delete(
  "/api/admin/users/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      await pool.query("DELETE FROM users WHERE id = $1 AND role != $2", [
        req.params.id,
        "admin",
      ]);
      res.json({ message: "User deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// Admin: Change user role
app.put(
  "/api/admin/users/:id/role",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { role } = req.body;
      const result = await pool.query(
        "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role",
        [role, req.params.id],
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// Admin: Get all recipes
app.get(
  "/api/admin/recipes",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(`
      SELECT r.*, u.name as author_name FROM recipes r 
      JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC
    `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// Admin: Delete any recipe
app.delete(
  "/api/admin/recipes/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      await pool.query("DELETE FROM recipes WHERE id = $1", [req.params.id]);
      res.json({ message: "Recipe deleted by admin" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// My recipes
app.get("/api/my-recipes", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM recipes WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ YOUTUBE API PROXY ============
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "AIzaSyDummyKeyReplace";

app.get("/api/youtube/search", async (req, res) => {
  try {
    const { q = "cooking recipe" } = req.query;
    // Enhanced query for cooking specifically in Telugu and English
    const searchQuery = `${q} cooking recipe (in telugu OR in english)`;
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(searchQuery)}&type=video&videoCategoryId=26&relevanceLanguage=en&key=${YOUTUBE_API_KEY}`,
    );
    const data = await response.json();
    if (data.error) {
      // Fallback: return mock data if API key is invalid
      return res.json({ items: getMockYouTubeVideos(q) });
    }
    res.json(data);
  } catch (err) {
    res.json({ items: getMockYouTubeVideos(req.query.q || "") });
  }
});

function getMockYouTubeVideos(query) {
  const qStr = query.split(' ')[0] || "Cooking";
  return [
    {
      id: { videoId: "bO1f2YwXXdY" }, // Real looking ID
      snippet: {
        title: `Authentic ${qStr} Recipe in Telugu | Tasty & Easy`,
        description: `Learn how to make the perfect ${qStr} step by step in Telugu. Enjoy this classic traditional style cooking.`,
        thumbnails: { high: { url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" } },
        channelTitle: "Andhra Kitchen Vlogs",
      },
    },
    {
      id: { videoId: "W7GQz5kZ9D8" },
      snippet: {
        title: `Restaurant Style ${qStr} | English Cooking Tutorial`,
        description: `The best ${qStr} recipe you will ever try. Quick, healthy, and easy to follow instructions in English.`,
        thumbnails: { high: { url: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&q=80" } },
        channelTitle: "Chef's Global Kitchen",
      },
    },
    {
      id: { videoId: "xyz123abc45" },
      snippet: {
        title: `Quick & Easy ${qStr} | Bachelor Cooking (Telugu)`,
        description: `A fast 10-minute ${qStr} recipe for beginners. Very simple ingredients explained in Telugu!`,
        thumbnails: { high: { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80" } },
        channelTitle: "Telugu Foodie Hub",
      },
    },
    {
      id: { videoId: "qwe456rty78" },
      snippet: {
        title: `Perfect ${qStr} Masterclass | English`,
        description: `Master the art of making ${qStr} from scratch. Detailed tips, tricks, and English voiceover.`,
        thumbnails: { high: { url: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&q=80" } },
        channelTitle: "Culinary Secrets",
      },
    },
    {
      id: { videoId: "lmnop987qrs" },
      snippet: {
        title: `Spicy ${qStr} Village Style | Telugu Recipe`,
        description: `Traditional village style preparation of ${qStr}. Authentic taste in Telugu language.`,
        thumbnails: { high: { url: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80" } },
        channelTitle: "Village Cooking Telugu",
      },
    },
    {
      id: { videoId: "uvw345xyz12" },
      snippet: {
        title: `Healthy ${qStr} Meal Prep | English Instructions`,
        description: `Healthy, low-calorie version of ${qStr}. Great for meal prep! Full instructions provided in English.`,
        thumbnails: { high: { url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80" } },
        channelTitle: "Healthy Life Eats",
      },
    },
  ];
}

// Serve frontend in production/testing
const distPath = path.join(__dirname, "../dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Conditional listener for local dev
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🍳 RecipeHub Server running on http://localhost:${PORT}`);
  });
}

export default app;
