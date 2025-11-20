import type { Route } from "./+types/_index";
import GreetingHome from "~/components/GreetingHome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Memoria de Señas" },
    {
      name: "description",
      content: "¡Bienvenido al juego de Memoria de Señas!",
    },
  ];
}

export default function Home() {
  return (
    <>
      <GreetingHome />
    </>
  );
}
