import type { Route } from "./+types/home";
import { Button, TextInput } from "@mantine/core";

export function meta() {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  // const users = await fetch("http://localhost:5173/api/users");
  // const data = (await users.json()) as {
  //   users: { id: number; name: string }[];
  // };
  return {
    message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE,
    // users: data.users,
    users: [] as { id: number; name: string }[],
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main className="flex items-center justify-center">
      <p>{loaderData.message}</p>
      <ul>
        {loaderData.users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
      <Button>Click me</Button>
      <TextInput label="Email" placeholder="Email" />
    </main>
  );
}
