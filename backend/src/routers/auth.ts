import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(3),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authRouter = router({
  signUp: publicProcedure
    .input(signUpSchema)
    .mutation(async ({ input }) => {
      const { email, password, name } = input;
      
      // Verifica se o usuário já existe
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        throw new Error('Email já cadastrado');
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Cria o usuário
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          name,
        });

      // Gera o token JWT
      const token = jwt.sign(
        { userId: newUser.insertId, email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Busca os dados do usuário recém-criado
      const [createdUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, newUser.insertId))
        .limit(1);

      return {
        user: {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
        },
        token,
      };
    }),

  signIn: publicProcedure
    .input(signInSchema)
    .mutation(async ({ input }) => {
      const { email, password } = input;

      // Encontra o usuário
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        throw new Error('Credenciais inválidas');
      }

      // Verifica a senha
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Credenciais inválidas');
      }

      // Gera o token JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      };
    }),

  me: protectedProcedure
    .query(({ ctx }) => {
      return {
        user: ctx.user,
      };
    }),
});
