import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as UserType } from "@shared/schema";
import createMemoryStore from "memorystore";

// Para poder extender el tipo Request con user
declare global {
  namespace Express {
    // Usar una interfaz para extender, no el mismo tipo
    interface User {
      id: number;
      email: string;
      password: string;
      displayName?: string;
      initials?: string;
      avatar?: string;
      createdAt?: Date;
      lastLogin?: Date;
      settings?: Record<string, any>;
    }
  }
}

// Convierte scrypt a versión con promesas
const scryptAsync = promisify(scrypt);

/**
 * Genera un hash seguro para la contraseña
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Verifica si la contraseña proporcionada coincide con el hash almacenado
 */
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * Configura la autenticación para la aplicación Express
 */
export function setupAuth(app: Express) {
  // Crear almacén de sesiones
  const MemoryStore = createMemoryStore(session);
  
  // Configuración de sesión
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "tu-secreto-super-secreto", // Usar variable de entorno en producción
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Usar HTTPS en producción
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 semana
    },
    store: new MemoryStore({
      checkPeriod: 86400000 // Limpia sesiones expiradas cada 24h
    })
  };

  // Configurar middleware de sesión
  app.use(session(sessionSettings));
  
  // Inicializar Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configurar estrategia de autenticación local
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' }, // Usar email como campo de identificación
      async (email, password, done) => {
        try {
          // Intentar obtener usuario por email
          const user = await storage.getUserByEmail(email);
          
          // Si no encontramos usuario o la contraseña no coincide, autenticación fallida
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Credenciales incorrectas" });
          }
          
          // Actualizar último inicio de sesión
          await storage.updateLastLogin(user.id);
          
          // Autenticación exitosa
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serializar usuario para almacenar en sesión
  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  // Deserializar usuario a partir del ID almacenado en sesión
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Rutas de autenticación
  
  // Registro de nuevo usuario
  app.post("/api/register", async (req, res, next) => {
    try {
      // Verificar si ya existe un usuario con ese email
      const existingUserByEmail = await storage.getUserByEmail(req.body.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "El correo electrónico ya está registrado" });
      }

      // Hashear la contraseña
      const hashedPassword = await hashPassword(req.body.password);
      
      // Generar iniciales si no se proporcionaron
      let initials = req.body.initials;
      if (!initials && req.body.displayName) {
        initials = req.body.displayName
          .split(' ')
          .map((name: string) => name[0])
          .join('')
          .toUpperCase()
          .substring(0, 2);
      }
      
      // Crear nuevo usuario
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        initials
      });

      // Iniciar sesión automáticamente después del registro
      req.login(user, (err) => {
        if (err) return next(err);
        
        // No enviar la contraseña al cliente
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Inicio de sesión
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: Express.User, info: { message: string }) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ 
          message: info?.message || "Credenciales incorrectas" 
        });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // No enviar la contraseña al cliente
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Cierre de sesión
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Sesión cerrada correctamente" });
    });
  });

  // Obtener usuario actual
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "No autenticado" });
    }
    
    // No enviar la contraseña al cliente
    const { password, ...userWithoutPassword } = req.user as UserType;
    res.json(userWithoutPassword);
  });
}

/**
 * Middleware para proteger rutas que requieren autenticación
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Acceso denegado. Inicia sesión primero." });
}