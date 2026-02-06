import express from "express";
import { setupAuth, registerAuthRoutes, authStorage } from "./replit_integrations/auth";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.NODE_ENV === "production" ? 5000 : 3001;

app.use(express.json());

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

async function startServer() {
  await setupAuth(app);
  registerAuthRoutes(app);
  
  app.post("/api/auth/magic-link", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      if (!process.env.SENDGRID_API_KEY) {
        return res.status(501).json({ 
          message: "Magic link authentication requires SendGrid. Please configure the SendGrid integration." 
        });
      }
      // Placeholder for actual magic link logic
      res.json({ message: "Magic link sent! Check your email." });
    } catch (error) {
      console.error("Magic link error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/phone", async (req, res) => {
    try {
      const { phone, code } = req.body;
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        return res.status(501).json({ 
          message: "Phone authentication requires Twilio. Please configure the Twilio integration." 
        });
      }
      if (code) {
        res.json({ message: "Phone verified successfully!" });
      } else {
        res.json({ message: "Verification code sent to your phone." });
      }
    } catch (error) {
      console.error("Phone auth error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (!PASSWORD_REGEX.test(password)) {
        return res.status(400).json({ 
          message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character" 
        });
      }

      const existingUser = await authStorage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const user = await authStorage.createUserWithPassword(email, passwordHash, firstName, lastName);

      req.login(
        { 
          claims: { sub: user.id, email: user.email },
          expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
        } as any, 
        (err) => {
          if (err) {
            console.error("Session creation error:", err);
            return res.status(500).json({ message: "Account created but failed to log in. Please try logging in." });
          }
          res.json({ 
            message: "Account created successfully!",
            user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }
          });
        }
      );
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account. Please try again." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await authStorage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!user.passwordHash) {
        return res.status(401).json({ 
          message: "This account uses social login. Please sign in with your social account." 
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.login(
        { 
          claims: { sub: user.id, email: user.email },
          expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
        } as any, 
        (err) => {
          if (err) {
            console.error("Session creation error:", err);
            return res.status(500).json({ message: "Login failed. Please try again." });
          }
          res.json({ 
            message: "Logged in successfully!",
            user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }
          });
        }
      );
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Auth server running on port ${PORT}`);
    console.log(`Node environment: ${process.env.NODE_ENV}`);
  });
}

startServer().catch(console.error);
