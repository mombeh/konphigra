import axios from "axios";
import { z } from "zod";

export interface Config {
  baseUrl: string;
}

export class KonphigraSDK {
  private client;

  constructor(private config: Config) {
    this.client = axios.create({
      baseURL: config.baseUrl,
    });
  }

  async getUsers() {
    const res = await this.client.get("/users");
    return z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          email: z.string().email(),
        })
      )
      .parse(res.data);
  }

  async createUser(user: { name: string; email: string }) {
    const res = await this.client.post("/users", user);
    return z
      .object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
      })
      .parse(res.data);
  }
}
