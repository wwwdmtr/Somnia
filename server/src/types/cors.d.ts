declare module "cors" {
  import type { RequestHandler } from "express";

  type OriginFn = (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => void;

  type CorsOriginOption =
    | boolean
    | string
    | RegExp
    | Array<string | RegExp>
    | OriginFn;

  type CorsOptions = {
    origin?: CorsOriginOption;
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  };

  type CorsOptionsDelegate<T> = (
    req: T,
    callback: (err: Error | null, options?: CorsOptions) => void,
  ) => void;

  const cors: <T extends { origin?: string | undefined }>(
    options?: CorsOptions | CorsOptionsDelegate<T>,
  ) => RequestHandler;

  export default cors;
}
