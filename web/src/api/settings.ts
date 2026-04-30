import { api } from "@/api/client";
import type { InstallationSettings } from "@/types";

export const getSettings = async (): Promise<InstallationSettings> => {
  const { data } = await api.get<InstallationSettings>("/settings");
  return data;
};

interface SetupInput {
  app_name: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
  organization_name: string;
}

export const runSetup = async (input: SetupInput) => {
  const { data } = await api.post<{ user: unknown }>("/setup", input);
  return data;
};
