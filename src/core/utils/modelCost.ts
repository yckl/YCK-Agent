export class ModelCostCalculator {
  public static calculateCost(tokens: number, rate: number) {
    return tokens * rate;
  }
}
