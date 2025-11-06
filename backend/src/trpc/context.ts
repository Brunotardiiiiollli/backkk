import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';

type CreateContextOptions = {
  req: any;
  res: any;
};

/**
 * Cria o contexto para cada requisição
 * @param opts Opções de contexto
 * @returns Contexto do tRPC
 */
export const createContext = (opts: CreateExpressContextOptions) => {
  const { req, res } = opts;
  
  return {
    req,
    res,
    // Adicione aqui qualquer dado que você queira disponibilizar em todos os procedimentos
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
