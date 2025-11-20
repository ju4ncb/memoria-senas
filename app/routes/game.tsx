import { useGuestUser } from "~/contexts/guestUserContext";
import { useMatch } from "~/contexts/matchContext";
import type { Route } from "./+types/game";
import InfoCard from "~/components/InfoCard";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Memoria de Señas" },
    {
      name: "description",
      content: "¡Bienvenido al juego de Memoria de Señas!",
    },
  ];
}

const HeaderGame = ({ username }: { username: string }) => {
  return (
    <header className="bg-gray-800 text-white p-4 w-100 mx-auto rounded-lg shadow-lg">
      <InfoCard
        title={`Bienvenido, ${username}!`}
        content="Este es nuestro juego de memoria en lengua de señas, donde vas a combatir contra otro jugador en tiempo real, para jugar presiona el botón Buscar Partida."
      />
    </header>
  );
};

const Leaderboard = () => {
  const [topPlayers, setTopPlayers] = useState<
    Array<{ username: string; score: number }>
  >([]);

  useEffect(() => {
    const fetchTopPlayers = async () => {
      const response = await fetch("/api/leaderboard");
      if (response.ok) {
        const data = await response.json();
        setTopPlayers(data.topPlayers);
      }
    };
    fetchTopPlayers();
  }, []);

  if (topPlayers.length === 0) {
    return (
      <div className="mt-6 text-red-100">
        <h2 className="text-xl font-bold mb-2 border-b border-red-100">
          Leaderboard
        </h2>
        <ul className="mt-4 bg-gray-800 text-red-50 p-4 rounded-lg shadow-lg w-100 mx-auto">
          <li>No hay jugadores en el leaderboard aún.</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-6 text-red-100">
      <h2 className="text-xl font-bold mb-2 border-b border-red-100">
        Leaderboard
      </h2>
      <ul className="mt-4 bg-gray-800 text-red-50 p-4 rounded-lg shadow-lg w-100 mx-auto">
        {topPlayers.map((player, index) => (
          <li key={index} className="mb-2">
            {player.username}: {player.score}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function Game() {
  const { guestUser, verifyIfInMatch } = useGuestUser();

  // if (!guestUser) {
  //   return <Navigate to="/" replace />;
  // }

  const { username } = guestUser ?? {
    username: "",
  };

  const [matchIdJoined, setMatchIdJoined] = useState<number>(-1);

  useEffect(() => {
    // Check if the guest user is already in a match
    const checkMatchStatus = async () => {
      const matchId = await verifyIfInMatch();
      setMatchIdJoined(matchId);
    };
    checkMatchStatus();
  }, []);

  const { createMatch } = useMatch();

  const handleMatchButtonClick = async () => {
    // If already in a match, redirect to that match
    if (matchIdJoined !== -1) {
      window.location.assign(`/match/${matchIdJoined}`);
      return;
    }
    // Otherwise, create a new match
    const matchId = await createMatch();
    if (matchId) {
      window.location.assign(`/match/${matchId}`);
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo crear la partida. Por favor, intenta nuevamente.",
      });
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center bg-custom text-white p-4 justify-start">
      <HeaderGame username={username} />
      <button
        onClick={handleMatchButtonClick}
        className="mt-6 px-6 py-3 bg-red-500 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition cursor-pointer"
      >
        {matchIdJoined !== -1 ? "Unirse a partida en curso" : "Buscar partida"}
      </button>
      <Leaderboard />
    </div>
  );
}
