import { createContext, useState, useEffect, useContext } from "react";

interface Match {
  matchId: number;
  state: "waiting" | "playing" | "finished";
  player1id: number;
  player2id: number;
}

interface MatchContextType {
  match: Match | null | undefined;
  createMatch: () => Promise<number>;
}

const MatchContext = createContext<MatchContextType | null>(null);

export const MatchProvider = ({ children }: { children: React.ReactNode }) => {
  const [match, setMatch] = useState<Match | null | undefined>(undefined);

  const createMatch = async () => {
    const res = await fetch("/api/match/create", {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setMatch(data);
      return data.matchId;
    }
    return "";
  };

  return (
    <MatchContext.Provider value={{ match, createMatch }}>
      {children}
    </MatchContext.Provider>
  );
};

export const useMatch = () => {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error("useMatch must be used within a MatchProvider");
  }
  return context;
};
