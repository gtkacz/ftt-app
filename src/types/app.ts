export enum Position {
  G = "G",
  F = "F",
  C = "C",
}

export interface Player {
  id: Number;
  first_name: String;
  last_name: String;
  salary?: null;
  contract_duration?: Number;
  primary_position: Position;
  secondary_position?: Position;
  nba_id?: Number;
  team?: Number;
  is_rfa: boolean;
  is_to: boolean;
  is_ir: boolean;
}
