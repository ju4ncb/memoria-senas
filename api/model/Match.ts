export default interface Match {
  matchId: string;
  state: "waiting" | "playing" | "finished";
  player1id: string;
  player2id: string;
}
