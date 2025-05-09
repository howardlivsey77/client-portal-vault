
import { TaxConstant } from "./tax-constants-service";
import { TaxBands } from "../calculations/TaxCalculator";

/**
 * Converts tax constants from the database format to the TaxBands format
 * required by the TaxCalculator
 */
export function convertTaxConstantsToTaxBands(constants: TaxConstant[]): TaxBands {
  // Default values based on 2023-2024 tax year
  const defaultBands: TaxBands = {
    basicRateThreshold: 12570 * 100, // in pence
    higherRateThreshold: 50270 * 100, // in pence
    basicRate: 0.2,
    higherRate: 0.4,
    additionalRate: 0.45,
    
    // Scottish tax bands (default values)
    scottishStarterRateThreshold: 12570 * 100, // in pence
    scottishBasicRateThreshold: 14732 * 100, // in pence
    scottishIntermediateRateThreshold: 25688 * 100, // in pence
    scottishHigherRateThreshold: 43662 * 100, // in pence
    scottishTopRateThreshold: 150000 * 100, // in pence
    scottishStarterRate: 0.19,
    scottishBasicRate: 0.20,
    scottishIntermediateRate: 0.21,
    scottishHigherRate: 0.42,
    scottishTopRate: 0.47
  };

  if (!constants || !constants.length) {
    return defaultBands;
  }

  const result = { ...defaultBands };

  // Process standard UK bands
  constants.forEach(constant => {
    if (constant.category === 'TAX_BANDS') {
      if (constant.key === 'PERSONAL_ALLOWANCE_THRESHOLD') {
        // Personal allowance is the basicRateThreshold in our model
        result.basicRateThreshold = (constant.value_numeric || defaultBands.basicRateThreshold) * 100;
      } 
      else if (constant.key === 'BASIC_RATE_THRESHOLD') {
        result.higherRateThreshold = (constant.value_numeric || defaultBands.higherRateThreshold) * 100;
      }
      else if (constant.key === 'BASIC_RATE') {
        result.basicRate = constant.value_numeric || defaultBands.basicRate;
      }
      else if (constant.key === 'HIGHER_RATE') {
        result.higherRate = constant.value_numeric || defaultBands.higherRate;
      }
      else if (constant.key === 'ADDITIONAL_RATE') {
        result.additionalRate = constant.value_numeric || defaultBands.additionalRate;
      }
      // Scottish rates
      else if (constant.key === 'STARTER_RATE_THRESHOLD' && constant.region === 'Scotland') {
        result.scottishStarterRateThreshold = (constant.value_numeric || defaultBands.scottishStarterRateThreshold) * 100;
      }
      else if (constant.key === 'BASIC_RATE_THRESHOLD' && constant.region === 'Scotland') {
        result.scottishBasicRateThreshold = (constant.value_numeric || defaultBands.scottishBasicRateThreshold) * 100;
      }
      else if (constant.key === 'INTERMEDIATE_RATE_THRESHOLD' && constant.region === 'Scotland') {
        result.scottishIntermediateRateThreshold = (constant.value_numeric || defaultBands.scottishIntermediateRateThreshold) * 100;
      }
      else if (constant.key === 'HIGHER_RATE_THRESHOLD' && constant.region === 'Scotland') {
        result.scottishHigherRateThreshold = (constant.value_numeric || defaultBands.scottishHigherRateThreshold) * 100;
      }
      else if (constant.key === 'TOP_RATE_THRESHOLD' && constant.region === 'Scotland') {
        result.scottishTopRateThreshold = (constant.value_numeric || defaultBands.scottishTopRateThreshold) * 100;
      }
      else if (constant.key === 'STARTER_RATE' && constant.region === 'Scotland') {
        result.scottishStarterRate = constant.value_numeric || defaultBands.scottishStarterRate;
      }
      else if (constant.key === 'BASIC_RATE' && constant.region === 'Scotland') {
        result.scottishBasicRate = constant.value_numeric || defaultBands.scottishBasicRate;
      }
      else if (constant.key === 'INTERMEDIATE_RATE' && constant.region === 'Scotland') {
        result.scottishIntermediateRate = constant.value_numeric || defaultBands.scottishIntermediateRate;
      }
      else if (constant.key === 'HIGHER_RATE' && constant.region === 'Scotland') {
        result.scottishHigherRate = constant.value_numeric || defaultBands.scottishHigherRate;
      }
      else if (constant.key === 'TOP_RATE' && constant.region === 'Scotland') {
        result.scottishTopRate = constant.value_numeric || defaultBands.scottishTopRate;
      }
    }
  });

  return result;
}
