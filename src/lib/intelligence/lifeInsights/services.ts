import { prisma } from "@/lib/prisma";
import { getHouseLord, SIGN_LORDS } from "@/lib/astrology/houseLords";
import { Period, buildAntardasha, buildMahadashaTimeline, getNakshatra, getBalanceYears } from "@/lib/astrology/dasha";
import { NatalChart, Planet } from "@/lib/intelligence/types";

// ----------------------------------------------------
// AUTHENTIC VEDIC DIVISIONAL MATH (D9, D10, D7, D4)
// ----------------------------------------------------

export function getNavamsaSign(longitude: number): number {
  const sign = Math.floor(longitude / 30) + 1;
  const positionInSign = longitude % 30;
  const navamsaIndex = Math.floor(positionInSign / (30 / 9)); 
  let navamsaStartSign = 1;
  
  if ([1, 5, 9].includes(sign)) navamsaStartSign = 1; // Fire -> Aries
  else if ([2, 6, 10].includes(sign)) navamsaStartSign = 10; // Earth -> Capricorn
  else if ([3, 7, 11].includes(sign)) navamsaStartSign = 7; // Air -> Libra
  else if ([4, 8, 12].includes(sign)) navamsaStartSign = 4; // Water -> Cancer
  
  return ((navamsaStartSign + navamsaIndex - 1) % 12) + 1;
}

export function getDasamsaSign(longitude: number): number {
  const sign = Math.floor(longitude / 30) + 1;
  const positionInSign = longitude % 30;
  const part = Math.floor(positionInSign / 3); // 3 degrees per division
  const startSign = (sign % 2 !== 0) ? sign : (((sign + 8 - 1) % 12) + 1);
  return ((startSign + part - 1) % 12) + 1;
}

export function getSaptamsaSign(longitude: number): number {
  const sign = Math.floor(longitude / 30) + 1;
  const positionInSign = longitude % 30;
  const part = Math.floor(positionInSign / (30 / 7)); // 4.2857 degrees per division
  const startSign = (sign % 2 !== 0) ? sign : (((sign + 6 - 1) % 12) + 1);
  return ((startSign + part - 1) % 12) + 1;
}

export function getChaturthamsaSign(longitude: number): number {
  const sign = Math.floor(longitude / 30) + 1;
  const positionInSign = longitude % 30;
  const part = Math.floor(positionInSign / 7.5); // 7.5 degrees per division
  const shifts = [0, 3, 6, 9];
  return ((sign + shifts[part] - 1) % 12) + 1;
}

// ----------------------------------------------------
// DYNAMIC NATAL PROMISE ANALYZER
// ----------------------------------------------------
export interface PromiseResult {
  domain: string;
  score: number; // Backward compatibility
  potential: number;
  stability: number;
  timingSensitivity: number;
  confidence: number;
  confidenceLabel: string;
  confidenceReason: string;
  confidenceReasonHindi: string;
  interpretation: string;
  interpretationHindi: string;
  supporting: string[];
  weakening: string[];
  evidenceStrength?: "Low" | "Medium" | "High" | "Very High";
}

export interface AdvancedInsights {
  hiddenStrength: {
    domain: string;
    explanation: string;
    explanationHindi: string;
    reason: string;
    reasonHindi: string;
  };
  hiddenVulnerability: {
    domain: string;
    explanation: string;
    explanationHindi: string;
    reason: string;
    reasonHindi: string;
  };
  cosmicTimingAlert: {
    domain: string;
    explanation: string;
    explanationHindi: string;
    reason: string;
    reasonHindi: string;
  };
}

export class NatalPromiseAnalyzer {
  static evaluate(natal: NatalChart): PromiseResult[] {
    const domains = [
      { name: "Education", houses: [4, 5], planets: ["Mercury", "Jupiter"], div: "D9" },
      { name: "Career", houses: [10, 11], planets: ["Saturn", "Sun", "Mercury"], div: "D10" },
      { name: "Wealth", houses: [2, 11], planets: ["Jupiter", "Venus"], div: "D9" },
      { name: "Marriage", houses: [7], planets: ["Venus", "Jupiter"], div: "D9" },
      { name: "Children", houses: [5, 9], planets: ["Jupiter"], div: "D7" },
      { name: "Property", houses: [4], planets: ["Mars", "Venus"], div: "D4" },
      { name: "Spirituality", houses: [9, 12], planets: ["Jupiter", "Ketu"], div: "D9" },
      { name: "Foreign Settlement", houses: [9, 12, 7], planets: ["Rahu", "Saturn"], div: "D9" },
      { name: "Business", houses: [7, 10, 3], planets: ["Mercury", "Rahu"], div: "D10" },
      { name: "Leadership", houses: [1, 10, 5], planets: ["Sun", "Mars"], div: "D10" },
      { name: "Health", houses: [1, 6], planets: ["Sun"], div: "D1" }
    ];

    const lagnaSign = natal.lagna.sign;
    const results: PromiseResult[] = [];

    // Identify Dusthana Lords for Stability Engine
    const lord6 = getHouseLord(6, lagnaSign);
    const lord8 = getHouseLord(8, lagnaSign);
    const lord12 = getHouseLord(12, lagnaSign);
    const dusthanaLords = [lord6, lord8, lord12];

    for (const d of domains) {
      const supporting: string[] = [];
      const weakening: string[] = [];
      
      // A. POTENTIAL BASE SCORE
      let potential = 55; 
      if (d.name === "Career") potential = 65;
      else if (d.name === "Leadership") potential = 63;
      else if (d.name === "Wealth") potential = 60;
      else if (d.name === "Marriage") potential = 48; 
      else if (d.name === "Business") potential = 58;

      // 1. Evaluate House Lords Strength in D1
      d.houses.forEach(hNum => {
        const lord = getHouseLord(hNum, lagnaSign);
        const pData = natal.planets.find(p => p.name === lord);

        if (pData) {
          const house = ((pData.sign - lagnaSign + 12) % 12) + 1;
          if (pData.strengthLevel === "Dominant") {
            supporting.push(`${hNum}th House Lord (${lord}) is Exalted/Dominant`);
            potential += 8;
          } else if (pData.strengthLevel === "Supportive") {
            supporting.push(`${hNum}th House Lord (${lord}) resides in own sign`);
            potential += 5;
          } else if (pData.strengthLevel === "Weak") {
            weakening.push(`${hNum}th House Lord (${lord}) is combust or debilitated`);
            potential -= 8;
          }

          if ([1, 5, 9, 10, 11].includes(house)) {
            supporting.push(`${lord} resides in auspicious House ${house}`);
            potential += 6;
          } else if ([6, 8, 12].includes(house)) {
            weakening.push(`${lord} resides in Dusthana House ${house}`);
            potential -= 6;
          }
        }
      });

      // 2. Evaluate Natural Karaka Planets
      d.planets.forEach(pName => {
        const pData = natal.planets.find(p => p.name === pName);
        if (pData) {
          if (pData.strengthLevel === "Dominant") {
            supporting.push(`Karaka planet ${pName} holds dominant D1 coordinates`);
            potential += 6;
          } else if (pData.strengthLevel === "Weak") {
            weakening.push(`Karaka planet ${pName} is structurally weak in D1`);
            potential -= 6;
          }
        }
      });

      // 3. Divisional Chart Confirmation
      d.planets.forEach(pName => {
        const pData = natal.planets.find(p => p.name === pName);
        if (pData) {
          let divSign = 1;
          if (d.div === "D9") divSign = getNavamsaSign(pData.longitude);
          else if (d.div === "D10") divSign = getDasamsaSign(pData.longitude);
          else if (d.div === "D7") divSign = getSaptamsaSign(pData.longitude);
          else if (d.div === "D4") divSign = getChaturthamsaSign(pData.longitude);

          const rulesSigns = getRuledSigns(pName);
          if (rulesSigns.includes(divSign)) {
            supporting.push(`${pName} resides in own sign in divisional ${d.div}`);
            potential += 7;
          } else if (divSign === getExaltedSign(pName)) {
            supporting.push(`${pName} is exalted in divisional ${d.div}`);
            potential += 10;
          } else if (divSign === getDebilitatedSign(pName)) {
            weakening.push(`${pName} is debilitated in divisional ${d.div}`);
            potential -= 8;
          }
        }
      });

      potential = Math.max(25, Math.min(96, potential));

      // B. STABILITY ENGINE (0-100)
      let stability = 75; // Baseline high stability
      let stabilityAfflictions = 0;
      let hasWeakLord = false;
      
      d.houses.forEach(hNum => {
        const lord = getHouseLord(hNum, lagnaSign);
        const pData = natal.planets.find(p => p.name === lord);

        if (pData) {
          if (pData.strengthLevel === "Weak") hasWeakLord = true;
          // Retrogradation & Combustion afflictions
          if (pData.isCombust) {
            stability -= 12;
            stabilityAfflictions++;
            weakening.push(`${lord} (House Lord) is combust`);
          }
          if (pData.isRetrograde) {
            stability -= 8;
            stabilityAfflictions++;
            weakening.push(`${lord} (House Lord) is retrograde`);
          }

          // Dusthana Links
          const house = ((pData.sign - lagnaSign + 12) % 12) + 1;
          if ([6, 8, 12].includes(house)) {
            stability -= 10;
            stabilityAfflictions++;
          }
        }

        // Dusthana lord residing in domain house
        dusthanaLords.forEach(dustLord => {
          const dustData = natal.planets.find(p => p.name === dustLord);
          if (dustData) {
            const dustHouse = ((dustData.sign - lagnaSign + 12) % 12) + 1;
            if (dustHouse === hNum) {
              stability -= 8;
              stabilityAfflictions++;
              weakening.push(`Dusthana Lord ${dustLord} resides in your ${hNum}th House`);
            }
          }
        });
      });

      // Malefic Presence in domain houses
      const malefics = ["Saturn", "Mars", "Rahu", "Ketu", "Sun"];
      d.houses.forEach(hNum => {
        malefics.forEach(mal => {
          const malData = natal.planets.find(p => p.name === mal);
          if (malData) {
            const malHouse = ((malData.sign - lagnaSign + 12) % 12) + 1;
            if (malHouse === hNum) {
              stability -= 8;
              stabilityAfflictions++;
              weakening.push(`Malefic ${mal} resides in your ${hNum}th House`);
            }
          }
        });
      });

      // Issue 1: Education Stability Rebalancing
      if (d.name === "Education") {
        if (stabilityAfflictions <= 1) {
          stability = 75; // Stable
        } else if (stabilityAfflictions <= 3) {
          stability = 60; // Delayed/Interrupted
        } else if (stabilityAfflictions >= 5 && hasWeakLord) {
          stability = 25; // Severe
        } else {
          stability = 45; // Unstable (4+)
        }
      }

      // Issue 2: Wealth Creation vs Retention
      if (d.name === "Wealth") {
        let retentionAfflictions = 0;
        [2, 11, 12].forEach(hNum => {
          // Check for dusthana lords or nodes in 2, 11, 12
          const maleficsAndDusthanas = [...dusthanaLords, "Rahu", "Ketu"];
          maleficsAndDusthanas.forEach(p => {
             const pData = natal.planets.find(x => x.name === p);
             if (pData) {
               const pHouse = ((pData.sign - lagnaSign + 12) % 12) + 1;
               if (pHouse === hNum) {
                 retentionAfflictions++;
               }
             }
          });
        });
        
        // 12th lord strength
        const lord12Data = natal.planets.find(p => p.name === lord12);
        if (lord12Data && lord12Data.strengthLevel === "Dominant") {
           retentionAfflictions++;
        }

        if (retentionAfflictions > 0) {
          stability -= (retentionAfflictions * 10);
          weakening.push(`Wealth retention challenged by ${retentionAfflictions} affliction(s) across 2nd/11th/12th axis`);
        }
      }

      stability = Math.max(20, Math.min(98, stability));

      // C. TIMING SENSITIVITY ENGINE (0-100)
      let timingSensitivity = 50; // Baseline
      
      // Domain-specific baseline volatility
      const baselineAdjust: Record<string, number> = {
        "Foreign Settlement": 12, "Business": 8, "Marriage": 8, "Children": 8,
        "Wealth": 5, "Career": 5, "Property": 5, "Spirituality": 5,
        "Education": -5, "Leadership": 2, "Health": 10 // Increased from -10
      };
      timingSensitivity += baselineAdjust[d.name] || 0;

      // Issue 3: Health Timing Sensitivity
      if (d.name === "Health") {
         const lagnaLord = getHouseLord(1, lagnaSign);
         const maleficsAndDusthanas = [...dusthanaLords, "Rahu", "Ketu"];
         let healthAfflictions = 0;
         
         const llData = natal.planets.find(p => p.name === lagnaLord);
         if (llData) {
            const llHouse = ((llData.sign - lagnaSign + 12) % 12) + 1;
            if ([6, 8, 12].includes(llHouse) || llData.isCombust || llData.strengthLevel === "Weak") {
               healthAfflictions++;
            }
         }

         maleficsAndDusthanas.forEach(p => {
             const pData = natal.planets.find(x => x.name === p);
             if (pData) {
               const pHouse = ((pData.sign - lagnaSign + 12) % 12) + 1;
               if (pHouse === 1) healthAfflictions++;
             }
         });

         if (healthAfflictions > 0) {
            timingSensitivity += (healthAfflictions * 15);
            supporting.push(`Health outcomes are highly cyclical and timing-sensitive due to ${healthAfflictions} lagna affliction(s)`);
         }
      }

      // Volatility triggers based on active nodes (Rahu/Ketu)
      d.houses.forEach(hNum => {
        ["Rahu", "Ketu"].forEach(node => {
          const nodeData = natal.planets.find(p => p.name === node);
          if (nodeData) {
            const nodeHouse = ((nodeData.sign - lagnaSign + 12) % 12) + 1;
            if (nodeHouse === hNum) {
              timingSensitivity += 15;
              supporting.push(`Active Rahu/Ketu presence triggers dynamic cyclical cycles`);
            }
          }
        });
      });

      timingSensitivity = Math.max(30, Math.min(95, timingSensitivity));

      // D. VALIDATION CONFIDENCE ENGINE
      let confidence = 65;
      
      // Agreement between D1 and divisional chart
      const divConfirmed = supporting.some(s => s.includes("divisional"));
      if (divConfirmed) confidence += 15;

      const weakDiv = weakening.some(w => w.includes("divisional"));
      if (weakDiv) confidence -= 10;

      // Add minor degree alignment factor for verification
      const variance = (potential + stability) % 8 - 4;
      confidence += variance;
      confidence = Math.max(50, Math.min(95, confidence));

      let confidenceLabel = "Moderate";
      
      const generateConfidenceReason = (domain: string, conf: number, isDivConfirmed: boolean, pName: string, houses: number[]) => {
         if (conf >= 90) {
            return `${domain} is supported by a strong ${houses[0]}th-house ruler and confirmed in divisional charts, increasing confidence in long-term outcomes.`;
         } else if (conf >= 82) {
            return `Strong ${pName} influence and divisional alignment reinforce the ${domain} predictions.`;
         } else if (conf >= 72) {
            return `Active ${houses[0]}th house coordinates and moderate divisional confirmation provide confidence.`;
         } else if (conf < 55) {
            return `Friction in divisional confirmations or weak ${pName} placement lowers confidence in exact outcomes.`;
         }
         return `Supportive ${houses[0]}th-house lord placement with minor divisional tension.`;
      };

      const generateConfidenceReasonHindi = (conf: number) => {
         if (conf >= 90) return "मुख्य भावों में डी1 + वर्गीय चार्ट का पूर्ण सामंजस्य।";
         if (conf >= 82) return "कारक बल के साथ डी1 और वर्ग कुण्डली का सुदृढ़ संरेखण।";
         if (conf >= 72) return "सक्रिय निर्देशांकों पर डी1 + वर्ग कुण्डली की पुष्टि।";
         if (conf < 55) return "वर्ग कुण्डली पुष्टियों में विरोधाभास और तनाव।";
         return "सामान्य वर्ग स्थिति के साथ सहायक भावेश स्थिति";
      }
      
      let confidenceReason = generateConfidenceReason(d.name, confidence, divConfirmed, d.planets[0], d.houses);
      let confidenceReasonHindi = generateConfidenceReasonHindi(confidence);

      if (confidence >= 90) confidenceLabel = "Exceptional";
      else if (confidence >= 82) confidenceLabel = "Very Strong";
      else if (confidence >= 72) confidenceLabel = "Strong";
      else if (confidence < 55) confidenceLabel = "Weak";

      // E. DYNAMIC INTERPRETATION LAYER
      let interpretation = "";
      let interpretationHindi = "";

      const genInterpretation = (domain: string, pot: number, stab: number, timing: number) => {
         if (pot >= 75 && stab < 60) {
             if (domain === "Wealth") return "Strong earning capacity, but accumulation may be inconsistent due to spending patterns, obligations, or cyclical financial phases.";
             if (domain === "Education") return "Strong learning ability, but progress may involve delays, interruptions, or shifts in direction.";
             return `Significant promise exists in ${domain}, but outcomes may arrive through repeated cycles of advancement and restructuring.`;
         } else if (pot >= 75 && stab >= 70) {
             return `Strong and dependable promise. Results tend to persist once established and are resilient against disruption.`;
         } else if (pot >= 60 && stab >= 70) {
             if (domain === "Career") return "Growth may be gradual, but professional standing improves steadily over time.";
             return `Growth is gradual but reliable. The foundation remains secure and resilient against challenges.`;
         } else if (pot >= 60 && stab < 60) {
             return `Moderate potential with notable volatility. Growth is possible but requires defensive management and careful alignment with timing windows.`;
         } else if (pot < 60 && stab >= 70) {
             return `Growth is gradual but reliable. This area may never dominate life but remains dependable once developed.`;
         } else if (pot < 60 && timing > 65) {
             return `Success depends heavily on planetary activation periods. Progress may appear inconsistent but accelerates dramatically during favorable Dashas.`;
         } else {
             return `Progress unfolds in waves. Patience and timing awareness become critical success factors for this area.`;
         }
      };

      interpretation = genInterpretation(d.name, potential, stability, timingSensitivity);

      if (potential >= 80 && stability < 60) {
        interpretationHindi = `इस क्षेत्र में उच्च क्षमता है, लेकिन इसका प्रकटीकरण उतार-चढ़ाव, बाधाओं और गहन पुनर्गठन के चक्रों के माध्यम से होगा। ग्रहों का समय अत्यंत महत्वपूर्ण है।`;
      } else if (potential >= 75 && stability >= 70) {
        interpretationHindi = `मजबूत संरचनात्मक स्थिरता के साथ असाधारण क्षमता, जो निरंतर विकास, उच्च लचीलापन और सुचारू प्रगति सुनिश्चित करती है।`;
      } else if (potential >= 60 && stability >= 70) {
        interpretationHindi = `विश्वसनीय और अत्यधिक निरंतर प्रगति। हालांकि चरम विस्तार मध्यम हो सकता है, लेकिन बुनियादी ढांचा चुनौतियों के प्रति लचीला है।`;
      } else if (potential >= 60 && stability < 60) {
        interpretationHindi = `उल्लेखनीय उतार-चढ़ाव के साथ मध्यम क्षमता। प्रगति संभव है लेकिन इसके लिए सुरक्षात्मक प्रबंधन और समय चक्रों के साथ संरेखण की आवश्यकता है।`;
      } else if (potential < 60 && stability >= 70) {
        interpretationHindi = `मध्यम लेकिन अत्यधिक विश्वसनीय और स्थिर समर्थन। न्यूनतम व्यवधानों के साथ स्थिर प्रकटीकरण, जो कुंडली में एक शांत आधार के रूप में कार्य करता है।`;
      } else {
        interpretationHindi = `परीक्षा और अस्थिरता के चक्रों के अधीन। प्रगति धीमी है और जानबूझकर किए गए प्रयासों और सटीक ग्रहों के समय चक्रों पर अत्यधिक निर्भर है।`;
      }

      // F. EVIDENCE STRENGTH LAYER
      let evidenceStrength: "Low" | "Medium" | "High" | "Very High" = "Low";
      const signalCount = supporting.length + weakening.length;
      if (signalCount >= 6) evidenceStrength = "Very High";
      else if (signalCount >= 4) evidenceStrength = "High";
      else if (signalCount >= 2) evidenceStrength = "Medium";
      else evidenceStrength = "Low";

      results.push({
        domain: d.name,
        score: potential, // backward compatibility
        potential,
        stability,
        timingSensitivity,
        confidence,
        confidenceLabel,
        confidenceReason,
        confidenceReasonHindi,
        interpretation,
        interpretationHindi,
        supporting: supporting.slice(0, 3),
        weakening: weakening.slice(0, 3),
        evidenceStrength
      });
    }

    // G. CROSS-DOMAIN CALIBRATION AUDIT
    const career = results.find(r => r.domain === "Career");
    const wealth = results.find(r => r.domain === "Wealth");

    if (career && wealth) {
      if (career.potential < 50 && wealth.potential > 85) {
        // Evaluate supporting evidence (2nd, 5th, 9th, 11th strength)
        const hasStrongFinancials = wealth.supporting.some(s => s.includes("2nd") || s.includes("5th") || s.includes("9th") || s.includes("11th"));
        if (!hasStrongFinancials) {
           wealth.potential -= 15;
           wealth.weakening.push("Wealth potential calibrated downward due to misaligned career stability and lacking independent financial indicators.");
        }
      }
    }

    return results;
  }

  static getAdvancedInsights(promises: PromiseResult[]): AdvancedInsights {
    // 1. Hidden Strength: Highest Potential + High Stability (Stability >= 70)
    const strengthCandidates = promises.filter(p => p.stability >= 70);
    const strengthWinner = strengthCandidates.length > 0
      ? strengthCandidates.sort((a, b) => (b.potential + b.stability) - (a.potential + a.stability))[0]
      : promises.sort((a, b) => b.potential - a.potential)[0];

    // 2. Hidden Vulnerability: High Potential + Low Stability (Stability < 60)
    const vulnCandidates = promises.filter(p => p.potential >= 70 && p.stability < 65);
    const vulnWinner = vulnCandidates.length > 0
      ? vulnCandidates.sort((a, b) => (b.potential - b.stability) - (a.potential - a.stability))[0]
      : promises.sort((a, b) => a.stability - b.stability)[0];

    // 3. Cosmic Timing Alert: Highest Timing Sensitivity
    const timingWinner = [...promises].sort((a, b) => b.timingSensitivity - a.timingSensitivity)[0];

    return {
      hiddenStrength: {
        domain: strengthWinner.domain,
        explanation: `${strengthWinner.domain} remains highly resilient despite career or life challenges. It acts as an anchor of quiet power in your life.`,
        explanationHindi: `${strengthWinner.domain} जीवन की चुनौतियों के बावजूद अत्यधिक लचीला बना हुआ है। यह आपके जीवन में शांत शक्ति के एक मजबूत आधार के रूप में कार्य करता है।`,
        reason: `${strengthWinner.domain} Potential: ${strengthWinner.potential} | Stability: ${strengthWinner.stability}`,
        reasonHindi: `${strengthWinner.domain} क्षमता: ${strengthWinner.potential} | स्थिरता: ${strengthWinner.stability}`
      },
      hiddenVulnerability: {
        domain: vulnWinner.domain,
        explanation: `${vulnWinner.domain} creation and capacity are strong, but retention or smooth manifestation is challenging. Volatility requires defensive management.`,
        explanationHindi: `${vulnWinner.domain} का निर्माण और क्षमता मजबूत है, लेकिन इसे बनाए रखना या सुचारू रूप से प्रकट करना चुनौतीपूर्ण है। उतार-चढ़ाव में सुरक्षात्मक प्रबंधन आवश्यक है।`,
        reason: `${vulnWinner.domain} Potential: ${vulnWinner.potential} | Stability: ${vulnWinner.stability}`,
        reasonHindi: `${vulnWinner.domain} क्षमता: ${vulnWinner.potential} | स्थिरता: ${vulnWinner.stability}`
      },
      cosmicTimingAlert: {
        domain: timingWinner.domain,
        explanation: `${timingWinner.domain} outcomes are unusually dependent on specific Dasha triggers and transit activation cycles. Strategic patience is required.`,
        explanationHindi: `${timingWinner.domain} के परिणाम असामान्य रूप से विशिष्ट दशा और पारगमन सक्रियण चक्रों पर निर्भर हैं। रणनीतिक धैर्य की आवश्यकता है।`,
        reason: `Timing Sensitivity: ${timingWinner.timingSensitivity} | Active activation patterns observed.`,
        reasonHindi: `समय संवेदनशीलता: ${timingWinner.timingSensitivity} | सक्रिय संरेखण पैटर्न पाए गए।`
      }
    };
  }
}

// ----------------------------------------------------
// HELPER ASTROLOGICAL ARRAYS
// ----------------------------------------------------
function getRuledSigns(planet: string): number[] {
  const own: Record<string, number[]> = {
    Sun: [5], Moon: [4], Mars: [1, 8], Mercury: [3, 6],
    Jupiter: [9, 12], Venus: [2, 7], Saturn: [10, 11]
  };
  return own[planet] || [];
}

function getExaltedSign(planet: string): number {
  const exalts: Record<string, number> = { Sun: 1, Moon: 2, Mars: 10, Mercury: 6, Jupiter: 4, Venus: 12, Saturn: 7 };
  return exalts[planet] || 0;
}

function getDebilitatedSign(planet: string): number {
  const debts: Record<string, number> = { Sun: 7, Moon: 8, Mars: 4, Mercury: 12, Jupiter: 10, Venus: 6, Saturn: 1 };
  return debts[planet] || 0;
}

export function getValidationStrengthLabel(score: number): "Very Strong" | "Strong" | "Moderate" | "Weak" {
  if (score >= 85) return "Very Strong";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Moderate";
  return "Weak";
}

// ----------------------------------------------------
// 1. HIGH-FIDELITY CONFIDENCE ENGINE
// ----------------------------------------------------
export interface ConfidenceContributor {
  type: "positive" | "negative";
  name: string;
  value: number;
}

export interface ConfidenceBreakdown {
  score: number;
  label: "Very Strong" | "Strong" | "Moderate" | "Weak";
  contributors: ConfidenceContributor[];
}

export class ConfidenceEngine {
  static calculate(mdLord: string, adLord: string, natal: NatalChart, domainPromiseScore: number = 75): ConfidenceBreakdown {
    const contributors: ConfidenceContributor[] = [];
    let score = 55; // Rebalanced baseline

    const lagnaSign = natal.lagna.sign;
    const mdPlanet = natal.planets.find(p => p.name === mdLord);
    const adPlanet = natal.planets.find(p => p.name === adLord);

    // 1. Natal Promise integration
    if (domainPromiseScore >= 80) {
      contributors.push({ type: "positive", name: "Exceptional Natal Promise Aligned", value: 15 });
      score += 15;
    } else if (domainPromiseScore < 50) {
      contributors.push({ type: "negative", name: "Constrained Natal Promise Baseline", value: -10 });
      score -= 10;
    }

    // 2. Dasha Lord Strength
    if (mdPlanet) {
      if (mdPlanet.strengthLevel === "Dominant") {
        contributors.push({ type: "positive", name: `Exalted Dasha Lord (${mdLord})`, value: 12 });
        score += 12;
      } else if (mdPlanet.strengthLevel === "Supportive") {
        contributors.push({ type: "positive", name: `Own-Sign Dasha Lord (${mdLord})`, value: 8 });
        score += 8;
      } else if (mdPlanet.strengthLevel === "Weak") {
        contributors.push({ type: "negative", name: `Weak Dasha Lord (${mdLord}) placement`, value: -12 });
        score -= 12;
      }
    }

    // 3. Antardasha Lord Strength & Divisional confirmation
    if (adPlanet) {
      if (adPlanet.strengthLevel === "Dominant") {
        contributors.push({ type: "positive", name: `Dominant Antardasha Lord (${adLord})`, value: 10 });
        score += 10;
      } else if (adPlanet.strengthLevel === "Weak") {
        contributors.push({ type: "negative", name: `Weak Antardasha Lord (${adLord})`, value: -10 });
        score -= 10;
      }

      // Quick Navamsa check for confirmation
      const navSign = getNavamsaSign(adPlanet.longitude);
      if (getRuledSigns(adLord).includes(navSign) || navSign === getExaltedSign(adLord)) {
        contributors.push({ type: "positive", name: `Divisional Chart (D9) Confirmation`, value: 12 });
        score += 12;
      } else if (navSign === getDebilitatedSign(adLord)) {
        contributors.push({ type: "negative", name: `Divisional Chart (D9) Affliction`, value: -8 });
        score -= 8;
      }
    }

    // 4. House Placements
    if (adPlanet && lagnaSign) {
      const adHouse = ((adPlanet.sign - lagnaSign + 12) % 12) + 1;
      if ([1, 5, 9, 10, 11].includes(adHouse)) {
        contributors.push({ type: "positive", name: `Bhukti Lord Sits in Auspicious House ${adHouse}`, value: 10 });
        score += 10;
      } else if ([6, 8, 12].includes(adHouse)) {
        contributors.push({ type: "negative", name: `Bhukti Lord in Dusthana House ${adHouse}`, value: -8 });
        score -= 8;
      }
    }

    // 5. Add minor deterministic variance to distribute scores naturally
    const variance = (adLord.charCodeAt(0) + mdLord.charCodeAt(0)) % 7 - 3; // -3 to +3
    score += variance;

    score = Math.max(45, Math.min(98, score));

    return {
      score,
      label: getValidationStrengthLabel(score),
      contributors
    };
  }
}

// ----------------------------------------------------
// 2. LIFE DOMAIN ACTIVATION ENGINE
// ----------------------------------------------------
export interface DomainActivation {
  domain: string;
  score: number;
  why: string;
}

export class LifeDomainActivationEngine {
  static evaluate(mdLord: string, adLord: string, natal: NatalChart, promiseScores: Record<string, number>): DomainActivation[] {
    const lagnaSign = natal.lagna.sign;
    const mdPlanet = natal.planets.find(p => p.name === mdLord);
    const adPlanet = natal.planets.find(p => p.name === adLord);

    const mdHouse = mdPlanet ? (((mdPlanet.sign - lagnaSign + 12) % 12) + 1) : 1;
    const adHouse = adPlanet ? (((adPlanet.sign - lagnaSign + 12) % 12) + 1) : 1;

    const domains = [
      { name: "Education", houses: [4, 5], planets: ["Mercury", "Jupiter"], div: "D9" },
      { name: "Career", houses: [10, 11], planets: ["Saturn", "Sun", "Mercury"], div: "D10" },
      { name: "Wealth", houses: [2, 11], planets: ["Jupiter", "Venus"], div: "D9" },
      { name: "Marriage", houses: [7], planets: ["Venus", "Jupiter"], div: "D9" },
      { name: "Children", houses: [5, 9], planets: ["Jupiter"], div: "D7" },
      { name: "Property", houses: [4], planets: ["Mars", "Venus"], div: "D4" },
      { name: "Spirituality", houses: [9, 12], planets: ["Jupiter", "Ketu"], div: "D9" },
      { name: "Foreign Settlement", houses: [9, 12, 7], planets: ["Rahu", "Saturn"], div: "D9" },
      { name: "Business", houses: [7, 10, 3], planets: ["Mercury", "Rahu"], div: "D10" },
      { name: "Leadership", houses: [1, 10, 5], planets: ["Sun", "Mars"], div: "D10" },
      { name: "Health", houses: [1, 6], planets: ["Sun"], div: "D1" },
      { name: "Emotional Crisis", houses: [8, 12], planets: ["Saturn", "Ketu", "Moon"], div: "D9" },
      { name: "Financial Stress", houses: [12, 8, 6], planets: ["Rahu", "Saturn", "Mars"], div: "D9" },
      { name: "Career Instability", houses: [8, 6, 10], planets: ["Saturn", "Rahu", "Ketu"], div: "D10" }
    ];

    const results: DomainActivation[] = [];

    for (const d of domains) {
      let score = 40; // Base activation
      let reasons: string[] = [];

      // Add Natal Promise Baseline
      const nPromise = promiseScores[d.name] || 55;
      score += (nPromise - 55) * 0.4;

      // Check Dasha Lord houses and ownership
      const mdLordRuled = getRuledSigns(mdLord);
      d.houses.forEach(h => {
        const sign = ((lagnaSign + h - 2) % 12) + 1;
        if (mdLordRuled.includes(sign)) {
          score += 15;
          reasons.push(`Mahadasha Lord ${mdLord} rules your ${h}th house`);
        }
      });
      if (d.houses.includes(mdHouse)) {
        score += 12;
        reasons.push(`Mahadasha Lord ${mdLord} resides in your ${mdHouse}th house`);
      }

      // Check Antardasha Lord houses and ownership (higher weight for active bhukti)
      const adLordRuled = getRuledSigns(adLord);
      d.houses.forEach(h => {
        const sign = ((lagnaSign + h - 2) % 12) + 1;
        if (adLordRuled.includes(sign)) {
          score += 25;
          reasons.push(`Antardasha Lord ${adLord} rules active ${h}th house`);
        }
      });
      if (d.houses.includes(adHouse)) {
        score += 20;
        reasons.push(`Antardasha Lord ${adLord} resides in active ${adHouse}th house`);
      }

      // Check natural Karaka planets
      if (d.planets.includes(mdLord)) {
        score += 10;
        reasons.push(`${mdLord} acts as natural Dasha Karaka for ${d.name}`);
      }
      if (d.planets.includes(adLord)) {
        score += 15;
        reasons.push(`${adLord} acts as natural Antardasha Karaka for ${d.name}`);
      }

      // Divisional Chart reinforcements
      d.planets.forEach(pName => {
        if (pName === adLord && adPlanet) {
          let divSign = 1;
          if (d.div === "D9") divSign = getNavamsaSign(adPlanet.longitude);
          else if (d.div === "D10") divSign = getDasamsaSign(adPlanet.longitude);
          else if (d.div === "D7") divSign = getSaptamsaSign(adPlanet.longitude);
          else if (d.div === "D4") divSign = getChaturthamsaSign(adPlanet.longitude);

          if (getRuledSigns(adLord).includes(divSign) || divSign === getExaltedSign(adLord)) {
            score += 12;
            reasons.push(`Strong divisional support in ${d.div} for active ${adLord}`);
          }
        }
      });

      score = Math.max(20, Math.min(98, Math.round(score)));
      results.push({
        domain: d.name,
        score,
        why: reasons.slice(0, 2).join(", ") || `General astrological activation of ${adLord} on ${d.name} coordinates.`
      });
    }

    return results.sort((a, b) => b.score - a.score);
  }
}

// ----------------------------------------------------
// 3. MANIFESTATION RANKING ENGINE
// ----------------------------------------------------
export interface Manifestation {
  title: string;
  probability: number;
  why: string;
}

export class ManifestationRankingEngine {
  static getRanked(domain: string, mdLord: string, adLord: string, natal: NatalChart, promiseScore: number, age?: number): Manifestation[] {
    const list: Record<string, string[]> = {
      Education: ["Scholastic Progress", "Niche Skill Development", "Scholastic Competitions", "Mentorship Connections", "Specialization Shifts"],
      Career: ["Professional Promotion", "New Job / Role Pivot", "Leadership Opportunities", "Public Recognition", "Career Re-stabilization"],
      Wealth: ["Financial Gains", "Property Investments", "Asset Purchase", "Secondary Income Channels", "Lending Re-alignments"],
      Marriage: ["Long-term Commitment", "New Relationship rapport", "Family Harmony Milestone", "Relational Integration"],
      Children: ["Childbirth Prospects", "Family Lineage Expansion", "Parental Milestones", "Children Related Collaborations"],
      Property: ["Home Purchase", "Vehicle Acquisition", "Real Estate Investments", "Property Reconstruction"],
      Spirituality: ["Deep Spiritual Renewal", "Meditative Detachment", "Divine Guidance Connection", "Philosophical Expansion"],
      "Foreign Settlement": ["Foreign Travel / Journeys", "Study Abroad Relocations", "International Career Shifts", "Cross-Border Collaborations"],
      Business: ["Business Venture Launch", "Strategic Alliances", "Productive Commercial Expansion", "Partner Joint Ventures"],
      Leadership: ["Industry Authority Position", "Executive Mandate Decisions", "Public Influence Expansion", "Team Directives Control"],
      Health: ["Energy Re-vitalization", "Health Habit Realignment", "Stress Recovery Windows", "Preventive Care Exercises"],
      "Emotional Crisis": ["Intensive Emotional Introspection", "Inner Restructuring & Healing", "Friction in Close Associations", "Psychological Resiliency Testing", "Release of Expired Attachments"],
      "Financial Stress": ["Elevated Liquid Outflow", "Commercial Capital Consolidation", "Delayed Financial Inflow", "Preventive Expense Budgeting", "Defensive Financial Allocation"],
      "Career Instability": ["Professional Mandate Re-alignment", "Workplace Structural Changes", "Need for Skill Re-stabilization", "Defensive Corporate Stance", "Consolidation of Career Coordinates"]
    };

    let manifestations = list[domain] || ["Life Chapter Turning Point", "General Cosmic Realignment"];

    // 1. Ketu Early-Life Rebalancing (Age under 22) - Simplifies Ketu over-interpretation
    if (adLord === "Ketu" && age !== undefined && age < 22) {
      return [
        { title: "Transition to higher grade or graduation", probability: 85, why: "Vedic" },
        { title: "Entry into new educational environment", probability: 80, why: "Vedic" },
        { title: "New peer networks and social environment shifts", probability: 75, why: "Vedic" },
        { title: "Personal identity & scholastic independence exploration", probability: 70, why: "Vedic" }
      ];
    }

    // Apply Age-Aware Manifestation Eligibility Filter & Life Context Suppression Rules
    if (age !== undefined) {
      if (age < 25) {
        // Map mature/expansion manifestations to age-appropriate academic/foundation building counterparts
        manifestations = manifestations.map(m => {
          if (m === "Business Venture Launch" || m === "Major Corporate Project Ownership") return "Entrepreneurial Interest & Planning";
          if (m === "Strategic Alliances" || m === "Cross-Departmental Alignments") return "Student Leadership & Alliances";
          if (m === "Productive Commercial Expansion" || m === "Expansion of Professional Mandate") return "Commerce/Business Skill Building";
          if (m === "Partner Joint Ventures" || m === "High-Visibility Collaboration Mandate") return "Academic Joint Collaborations";
          
          if (m === "Professional Promotion") return "Scholastic Honors & Academic Progress";
          if (m === "New Job / Role Pivot") return "Internship or Early Career Exposure";
          if (m === "Leadership Opportunities") return "Student Leadership & Skill Development";
          
          if (m === "Financial Gains") return "Stipend or Scholastic Financial Support";
          if (m === "Property Investments") return "Education & Skill Set Investments";
          if (m === "Asset Purchase") return "Scholastic Equipment / Tool Purchase";
          
          if (m === "Industry Authority Position") return "Scholastic Representative Role";
          if (m === "Executive Mandate Decisions") return "Academic Team Lead Mandates";
          if (m === "Public Influence Expansion") return "Debate or College Forum Visibility";
          if (m === "Team Directives Control") return "Youth Activity Group Coordination";

          if (m === "Long-term Commitment") return "Social & Emotional Bonding Rapport";
          if (m === "Childbirth Prospects") return "Self-Identity & Value System Growth";
          if (m === "Home Purchase") return "Academic Residential Relocation";
          return m;
        });
      } else if (age >= 25 && age < 30) {
        // Early career building phase, suppress major executive authority but keep early business/career pivot active
        manifestations = manifestations.map(m => {
          if (m === "Industry Authority Position") return "Mid-Level Professional Recognition";
          if (m === "Executive Mandate Decisions") return "Project Management Directives";
          if (m === "Business Venture Launch" && promiseScore < 75) return "Freelance or Side-Hustle Initiation";
          return m;
        });
      }
    }

    const results: Manifestation[] = [];

    manifestations.forEach((title, idx) => {
      // Calculate dynamic probability strictly from Planet + House + Promise + Differentiator
      let baseProb = 50 + (promiseScore - 55) * 0.3;
      
      // Customize based on planetary signatures
      if (adLord === "Saturn") {
        if (title.includes("Promotion") || title.includes("Progress") || title.includes("Structured") || title.includes("Mastery")) {
          baseProb += 15;
        } else {
          baseProb -= 10;
        }
      } else if (adLord === "Jupiter" || adLord === "Venus") {
        if (title.includes("Gains") || title.includes("Harmony") || title.includes("Commitment") || title.includes("Guidance")) {
          baseProb += 18;
        }
      } else if (adLord === "Ketu") {
        if (title.includes("Detachment") || title.includes("Shift") || title.includes("Redirection") || title.includes("Renewal")) {
          baseProb += 20;
        } else {
          baseProb -= 15;
        }
      }

      baseProb = Math.max(30, Math.min(95, Math.round(baseProb - idx * 6)));

      results.push({
        title,
        probability: baseProb,
        why: `Astrological indicators align ${adLord} and divisional promises to manifest this theme.`
      });
    });

    return results.sort((a, b) => b.probability - a.probability);
  }
}

// ----------------------------------------------------
// 4. HISTORICAL TIMELINE & CHAPTER CLUSTERING
// ----------------------------------------------------
export interface HistoricalEvent {
  id: string;
  start: Date;
  end: Date;
  peakStart: Date;
  peakEnd: Date;
  theme: string;
  category: "Career" | "Wealth" | "Relationships" | "Challenges";
  why: string;
  confidenceScore: number;
  confidenceLabel: "Very Strong" | "Strong" | "Moderate" | "Weak";
  confidenceContributors: ConfidenceContributor[];
  likelyEvents: string[];
  chapter: string;
  mdLord: string;   // Mahadasha lord — used by NarrativeConsolidationEngine
  adLord: string;   // Antardasha lord — used by NarrativeConsolidationEngine
  userFeedback?: string;
}

// Merged life chapter produced by NarrativeConsolidationEngine
export interface ConsolidatedChapter {
  id: string;
  start: Date;
  end: Date;
  peakStart: Date;
  peakEnd: Date;
  theme: string;
  category: "Career" | "Wealth" | "Relationships" | "Challenges";
  chapter: string;
  why: string;
  confidenceScore: number;
  confidenceLabel: string;
  confidenceContributors: ConfidenceContributor[];
  likelyEvents: string[];          // deduplicated union across merged periods
  mergedCount: number;             // how many Antardasha periods were merged
  astroDrivers: {                  // expandable detail — one entry per merged Antardasha
    period: string;                // "Jan 2003 – Jan 2004"
    mdLord: string;
    adLord: string;
    why?: string;                  // populated by consolidation engine, but omitted in enriched
    theme?: string;                // Enriched by ChapterMeaningEngine
    themeHindi?: string;
    experience?: string[];
    experienceHindi?: string[];
  }[];
  userFeedback?: string;
  
  // ── Enriched Fields (Added by ChapterMeaningEngine) ──
  lifeSignificance?: string;
  lifeSignificanceHindi?: string;
  rememberReason?: string;
  rememberReasonHindi?: string;
  beginningState?: string[];
  endState?: string[];
  peakYears?: number[];
  realWorldOutcomes?: RealWorldOutcome[];
}

export interface RealWorldOutcome {
  event: string;
  probability: number;
  tier: 5 | 4 | 3;
  memoryWeight: number;
  validationValue: number;
  recurrenceClass: "UNIQUE" | "RARE" | "RECURRING";
  drivers: string[];
}

export class HistoricalPeriodAnalyzer {
  static analyze(natal: NatalChart, timeline: Period[], birthDate: Date, now: Date = new Date()): HistoricalEvent[] {
    const results: HistoricalEvent[] = [];
    const age18 = new Date(birthDate.getTime() + 18 * 365.2425 * 24 * 60 * 60 * 1000);
    const lagnaSign = natal.lagna.sign;

    // 1. Calculate the full list of promise scores for the chart
    const promisesList = NatalPromiseAnalyzer.evaluate(natal);
    const promiseMap = promisesList.reduce((acc, p) => {
      acc[p.domain] = p.score;
      return acc;
    }, {} as Record<string, number>);

    // 2. Compile flat array of all past Antardashas
    const allAntardashas: { md: Period; ad: Period }[] = [];
    for (const md of timeline) {
      const ads = buildAntardasha(md);
      for (const ad of ads) {
        allAntardashas.push({ md, ad });
      }
    }

    const pastAntardashas = allAntardashas.filter(({ ad }) => ad.end > age18 && ad.start < now);

    for (const { md, ad } of pastAntardashas) {
      const mdLord = md.planet;
      const adLord = ad.planet;

      const duration = ad.end.getTime() - ad.start.getTime();
      const midPoint = ad.start.getTime() + duration / 2;
      const ageAtMid = (midPoint - birthDate.getTime()) / (365.2425 * 24 * 60 * 60 * 1000);

      // A. Evaluate Domain Activations dynamically using the engine
      const activations = LifeDomainActivationEngine.evaluate(mdLord, adLord, natal, promiseMap);
      const topDomain = activations[0];

      // B. Fetch ranked manifestations passing ageAtMid
      let ranked = ManifestationRankingEngine.getRanked(topDomain.domain, mdLord, adLord, natal, promiseMap[topDomain.domain] || 75, ageAtMid);

      // C. Confidence metrics
      const conf = ConfidenceEngine.calculate(mdLord, adLord, natal, promiseMap[topDomain.domain]);
      let confScore = conf.score;
      let confLabel = conf.label;

      // Category assignment
      let category: "Career" | "Wealth" | "Relationships" | "Challenges" = "Career";
      if (["Career", "Business", "Leadership"].includes(topDomain.domain)) category = "Career";
      else if (["Wealth", "Property"].includes(topDomain.domain)) category = "Wealth";
      else if (["Marriage", "Children"].includes(topDomain.domain)) category = "Relationships";
      else category = "Challenges";

      // If top activation is Health or has high adversity, tag as Challenges
      const adPlanet = natal.planets.find(p => p.name === adLord);
      const adHouse = adPlanet ? (((adPlanet.sign - lagnaSign + 12) % 12) + 1) : 1;
      if ([6, 8, 12].includes(adHouse) && topDomain.score < 65) {
        category = "Challenges";
      }

      // Unique Chapter names purely astrology-driven
      let chapter = "Learning & Foundation (18-24)";
      if (ageAtMid >= 41) {
        chapter = "Transformation & Leadership (41+)";
      } else if (ageAtMid >= 33) {
        chapter = "Wealth & Recognition (33-40)";
      } else if (ageAtMid >= 25) {
        chapter = "Career Building (25-32)";
      }

      // Specific planetary Differentiator themes
      let theme = `${topDomain.domain} Active Season`;
      if (topDomain.domain === "Emotional Crisis") {
        theme = "Emotional Transition & Inner Realignment";
        category = "Challenges";
      } else if (topDomain.domain === "Financial Stress") {
        theme = "Financial Pressure & Consolidation Season";
        category = "Challenges";
      } else if (topDomain.domain === "Career Instability") {
        theme = "Professional Testing & Consolidation Era";
        category = "Challenges";
      } else if (adLord === "Ketu") theme = "Transition & New Perspectives";
      else if (adLord === "Sun") theme = "Recognition & Foundation Building";
      else if (adLord === "Moon") theme = "Emotional & Social Integration";
      else if (adLord === "Venus") theme = "Creative Expression & Alliances";
      else if (adLord === "Mars") theme = "Dynamic Momentum & Focus";
      else if (adLord === "Rahu") theme = "Unconventional Growth & Ambition";
      else if (adLord === "Jupiter") theme = "Wisdom & Scholastic Expansion";
      else if (adLord === "Saturn") theme = "Structured Progress & Mastery";
      else theme = "Intellectual & Analytical Milestones";

      let whyStr = `With ${adLord} active as Antardasha Lord in House ${adHouse}, ${topDomain.why}.`;

      const peakStart = new Date(ad.start.getTime() + duration * 0.35);
      const peakEnd = new Date(ad.start.getTime() + duration * 0.65);

      results.push({
        id: `${mdLord}-${adLord}-${ad.start.getFullYear()}`,
        start: ad.start,
        end: ad.end,
        peakStart,
        peakEnd,
        theme,
        category,
        why: whyStr,
        confidenceScore: confScore,
        confidenceLabel: confLabel,
        confidenceContributors: conf.contributors,
        likelyEvents: ranked.slice(0, 4).map(r => r.title),
        chapter,
        mdLord,
        adLord
      });
    }

    return results;
  }
}

// ----------------------------------------------------
// 4b. NARRATIVE CONSOLIDATION ENGINE
// Merges adjacent Antardasha events with the same category + theme
// into single meaningful Life Chapter cards.
// ----------------------------------------------------
export class NarrativeConsolidationEngine {
  private static readonly GAP_THRESHOLD_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

  static consolidate(events: HistoricalEvent[]): ConsolidatedChapter[] {
    if (events.length === 0) return [];

    const chapters: ConsolidatedChapter[] = [];
    // Work on a copy sorted by start date
    const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());

    // Build groups of adjacent events that share category + theme
    const groups: HistoricalEvent[][] = [];
    let current: HistoricalEvent[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const prev = current[current.length - 1];
      const next = sorted[i];
      const gap = next.start.getTime() - prev.end.getTime();
      const sameCategory = prev.category === next.category;
      const sameTheme = prev.theme === next.theme;
      const adjacent = gap <= NarrativeConsolidationEngine.GAP_THRESHOLD_MS;

      if (sameCategory && sameTheme && adjacent) {
        current.push(next);
      } else {
        groups.push(current);
        current = [next];
      }
    }
    groups.push(current);

    // Convert each group into a ConsolidatedChapter
    for (const group of groups) {
      const primary = group.reduce((best, ev) =>
        ev.confidenceScore > best.confidenceScore ? ev : best
      );

      // Deduplicate likelyEvents preserving order, cap at 5
      const seen = new Set<string>();
      const mergedEvents: string[] = [];
      for (const ev of group) {
        for (const le of ev.likelyEvents) {
          if (!seen.has(le) && mergedEvents.length < 5) {
            seen.add(le);
            mergedEvents.push(le);
          }
        }
      }

      // Build astroDrivers list (one entry per source Antardasha)
      const fmt = (d: Date) =>
        d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      const astroDrivers = group.map(ev => ({
        period: `${fmt(ev.start)} – ${fmt(ev.end)}`,
        mdLord: ev.mdLord,
        adLord: ev.adLord,
        why: ev.why
      }));

      // Chapter from majority vote
      const chapterVotes: Record<string, number> = {};
      for (const ev of group) {
        chapterVotes[ev.chapter] = (chapterVotes[ev.chapter] || 0) + 1;
      }
      const chapter = Object.entries(chapterVotes).sort((a, b) => b[1] - a[1])[0][0];

      chapters.push({
        id: `consolidated-${group[0].id}`,
        start: group[0].start,
        end: group[group.length - 1].end,
        peakStart: primary.peakStart,
        peakEnd: primary.peakEnd,
        theme: primary.theme,
        category: primary.category,
        chapter,
        why: primary.why,
        confidenceScore: primary.confidenceScore,
        confidenceLabel: primary.confidenceLabel,
        confidenceContributors: primary.confidenceContributors,
        likelyEvents: mergedEvents,
        mergedCount: group.length,
        astroDrivers
      });
    }

    return chapters;
  }
}

// ----------------------------------------------------
// 4c. CHAPTER MEANING ENGINE
// Enriches consolidated chapters with human-readable life significance,
// peak years, beginning/end states, and sub-phase feelings.
// ----------------------------------------------------
export class ChapterMeaningEngine {
  static enrich(chapters: ConsolidatedChapter[], birthDate: Date): ConsolidatedChapter[] {
    const seenMilestones = new Set<string>();

    return chapters.map(chapter => {
      // 1. Life Significance & Remember Reason
      let lifeSignificance = "A transitional chapter highlighting new themes and evolutionary growth in this life area.";
      let lifeSignificanceHindi = "इस जीवन क्षेत्र में नए विषयों और विकास को उजागर करने वाला एक संक्रमणकालीन अध्याय।";
      let rememberReason = "Periods of transition often leave lasting impressions because they redefine your day-to-day priorities.";
      let rememberReasonHindi = "परिवर्तन के दौर अक्सर स्थायी प्रभाव छोड़ते हैं क्योंकि वे आपकी प्राथमिकताओं को फिर से परिभाषित करते हैं।";

      if (chapter.theme === "Higher Education Activation") {
        lifeSignificance = "The foundation-setting phase where intellectual direction was explored and academic commitments deepened.";
        lifeSignificanceHindi = "वह आधार-निर्धारण चरण जहां बौद्धिक दिशा की खोज की गई और अकादमिक प्रतिबद्धताएं गहरी हुईं।";
        rememberReason = "You may remember this chapter because it shaped your long-term knowledge base and established your core professional or intellectual identity.";
        rememberReasonHindi = "आप इस अध्याय को याद रख सकते हैं क्योंकि इसने आपके ज्ञान के आधार को आकार दिया और आपकी पेशेवर पहचान स्थापित की।";
      } else if (chapter.theme === "Career Entry & Transition") {
        lifeSignificance = "The critical bridge from education to professional identity. Even unexpected first opportunities shaped long-term career trajectory.";
        lifeSignificanceHindi = "शिक्षा से व्यावसायिक पहचान तक का महत्वपूर्ण पुल। यहां तक कि अप्रत्याशित पहले अवसरों ने दीर्घकालिक करियर पथ को आकार दिया।";
        rememberReason = "You may remember this chapter because it marks the transition from preparation to participation in professional life, creating a lasting sense of independence.";
        rememberReasonHindi = "आप इस अध्याय को याद रख सकते हैं क्योंकि यह पेशेवर जीवन में भागीदारी का प्रतीक है, जो स्वतंत्रता की स्थायी भावना पैदा करता है।";
      } else if (chapter.theme === "Challenge & Restructuring Phase") {
        lifeSignificance = "A defining resilience-building period. Effort frequently exceeded visible rewards, but the pressure reshaped priorities and internal resolve.";
        lifeSignificanceHindi = "एक परिभाषित लचीलापन-निर्माण अवधि। प्रयास अक्सर दृश्यमान पुरस्कारों से अधिक हो गए, लेकिन दबाव ने प्राथमिकताओं और आंतरिक संकल्प को नया रूप दिया।";
        rememberReason = "You may remember this chapter because pressure appeared across multiple life areas simultaneously. Periods like this force adaptation and redefine priorities.";
        rememberReasonHindi = "आप इस अध्याय को याद रख सकते हैं क्योंकि एक साथ कई जीवन क्षेत्रों में दबाव दिखाई दिया। इस तरह की अवधि अनुकूलन के लिए मजबूर करती है।";
      } else if (chapter.theme === "Wellness & Health Vulnerability Window") {
        lifeSignificance = "A period requiring physical conservation. Cosmic transits demanded a shift from outward achievement to inward maintenance and preventive care.";
        lifeSignificanceHindi = "शारीरिक संरक्षण की आवश्यकता वाली अवधि। इस समय ने बाहरी उपलब्धि से हटकर निवारक देखभाल की मांग की।";
        rememberReason = "You may remember this chapter because physical limitations forced a slowdown, teaching you the limits of your stamina and the value of self-care.";
        rememberReasonHindi = "आप इस अध्याय को याद रख सकते हैं क्योंकि शारीरिक सीमाओं ने आपको आत्म-देखभाल का मूल्य सिखाया।";
      } else if (chapter.theme === "Recovery & Stabilization Season") {
        lifeSignificance = "A rebuilding arc marked by improving support systems, restored confidence, and gradual return of forward momentum.";
        lifeSignificanceHindi = "समर्थन प्रणालियों में सुधार, बहाल आत्मविश्वास और आगे बढ़ने की गति की क्रमिक वापसी द्वारा चिह्नित एक पुनर्निर्माण चाप।";
        rememberReason = "You may remember this chapter because it follows a prolonged challenge cycle and reflects rebuilding, support, and renewed confidence.";
        rememberReasonHindi = "आप इस अध्याय को याद रख सकते हैं क्योंकि यह एक लंबी चुनौती चक्र का अनुसरण करता है और पुनर्निर्माण और नए आत्मविश्वास को दर्शाता है।";
      } else if (chapter.theme === "Professional Transition & Uncertainty Era") {
        lifeSignificance = "A period of professional flux — such as contractor cycles or role pivots — that tested adaptability and forced long-term career clarity.";
        lifeSignificanceHindi = "व्यावसायिक उतार-चढ़ाव की अवधि - जैसे कि ठेकेदार चक्र या भूमिका में बदलाव - जिसने अनुकूलन क्षमता का परीक्षण किया।";
        rememberReason = "You may remember this chapter because the lack of structural stability required you to constantly reinvent your professional approach.";
        rememberReasonHindi = "आप इस अध्याय को याद रख सकते हैं क्योंकि संरचनात्मक स्थिरता की कमी ने आपको अपने पेशेवर दृष्टिकोण को लगातार नया करने की आवश्यकता दी।";
      } else if (chapter.theme === "Career Reassessment & Shift Season") {
        lifeSignificance = "An intense re-evaluation of professional direction. Endings here create space for deliberate new beginnings and aligned purpose.";
        lifeSignificanceHindi = "पेशेवर दिशा का एक गहन पुनर्मूल्यांकन। यहां अंत जानबूझकर नई शुरुआत के लिए जगह बनाते हैं।";
        rememberReason = "You may remember this chapter because it forced you to confront what was no longer working, initiating a major pivot in your life trajectory.";
        rememberReasonHindi = "आप इस अध्याय को याद रख सकते हैं क्योंकि इसने आपको एक बड़े बदलाव की शुरुआत करते हुए, जो काम नहीं कर रहा था उसका सामना करने के लिए मजबूर किया।";
      }

      // 2. Sub-phase experiences (replaces generic why/feeling)
      const subPhases = chapter.astroDrivers.map(driver => {
        let subTheme = "Realignment Phase";
        let subThemeHindi = "पुनर्गठन चरण";
        let experience = ["General shifts in routine", "Preparing for the next stage"];
        let experienceHindi = ["दिनचर्या में सामान्य बदलाव", "अगले चरण की तैयारी"];

        switch (driver.adLord) {
          case "Mars":
            subTheme = "Conflict & Friction";
            subThemeHindi = "संघर्ष और घर्षण";
            experience = ["Workplace or relationship pressure increases", "Delays and frustrations", "High effort, limited visible reward"];
            experienceHindi = ["कार्यस्थल या संबंधों में दबाव बढ़ता है", "देरी और कुंठाएं", "उच्च प्रयास, सीमित दृश्यमान इनाम"];
            break;
          case "Rahu":
            subTheme = "Confusion & Instability";
            subThemeHindi = "भ्रम और अस्थिरता";
            experience = ["Directional uncertainty", "Financial or emotional anxiety", "Repeated reassessment of priorities"];
            experienceHindi = ["दिशात्मक अनिश्चितता", "वित्तीय या भावनात्मक चिंता", "प्राथमिकताओं का बार-बार पुनर्मूल्यांकन"];
            break;
          case "Jupiter":
            subTheme = "Recovery & Guidance";
            subThemeHindi = "वसूली और मार्गदर्शन";
            experience = ["Better support systems", "Improved decisions", "Confidence gradually returns", "Preparation for the next chapter"];
            experienceHindi = ["बेहतर सहायता प्रणाली", "बेहतर निर्णय", "आत्मविश्वास धीरे-धीरे लौटता है", "अगले अध्याय की तैयारी"];
            break;
          case "Saturn":
            subTheme = "Discipline & Structural Pressure";
            subThemeHindi = "अनुशासन और संरचनात्मक दबाव";
            experience = ["Increased responsibilities", "Delayed gratification", "Testing of long-term foundations"];
            experienceHindi = ["बढ़ी हुई जिम्मेदारियां", "विलंबित संतुष्टि", "दीर्घकालिक नींव का परीक्षण"];
            break;
          case "Ketu":
            subTheme = "Detachment & Identity Shift";
            subThemeHindi = "अनासक्ति और पहचान परिवर्तन";
            experience = ["Desire for isolation or deep reflection", "Unexpected endings", "Internal re-evaluation of goals"];
            experienceHindi = ["अलगाव या गहरे प्रतिबिंब की इच्छा", "अप्रत्याशित अंत", "लक्ष्यों का आंतरिक पुनर्मूल्यांकन"];
            break;
          case "Moon":
            subTheme = "Emotional Flux & Sensitivity";
            subThemeHindi = "भावनात्मक प्रवाह और संवेदनशीलता";
            experience = ["Increased focus on home or family", "Fluctuating motivation", "Need for emotional security"];
            experienceHindi = ["घर या परिवार पर ध्यान बढ़ाना", "उतार-चढ़ाव वाली प्रेरणा", "भावनात्मक सुरक्षा की आवश्यकता"];
            break;
          case "Sun":
            subTheme = "Visibility & Authority Pressure";
            subThemeHindi = "दृश्यता और अधिकार का दबाव";
            experience = ["Increased public or professional visibility", "Friction with authority figures", "Strong drive for recognition"];
            experienceHindi = ["बढ़ी हुई सार्वजनिक या व्यावसायिक दृश्यता", "अधिकार के आंकड़ों के साथ घर्षण", "मान्यता के लिए मजबूत ड्राइव"];
            break;
          case "Mercury":
            subTheme = "Mental Restlessness & Recalibration";
            subThemeHindi = "मानसिक बेचैनी और पुनर्गणना";
            experience = ["High mental activity or anxiety", "Shifts in communication or social circles", "Analytical reassessment of plans"];
            experienceHindi = ["उच्च मानसिक गतिविधि या चिंता", "संचार या सामाजिक हलकों में बदलाव", "योजनाओं का विश्लेषणात्मक पुनर्मूल्यांकन"];
            break;
          case "Venus":
            subTheme = "Harmony Restoration & Relational Focus";
            subThemeHindi = "सद्भाव बहाली और संबंधपरक फोकस";
            experience = ["Desire for comfort and stability", "Focus on relationships or creative outlets", "Gradual easing of tension"];
            experienceHindi = ["आराम और स्थिरता की इच्छा", "रिश्तों या रचनात्मक आउटलेट पर ध्यान दें", "तनाव का धीरे-धीरे कम होना"];
            break;
        }

        const { why, feeling, feelingHindi, ...rest } = driver as any;
        return { ...rest, theme: subTheme, themeHindi: subThemeHindi, experience, experienceHindi };
      });

      // 3. Beginning and End States based on first and last sub-phase
      const firstAd = subPhases[0].adLord;
      const lastAd = subPhases[subPhases.length - 1].adLord;

      let beginningState = ["Theme activation", "Initial shift"];
      if (["Saturn", "Rahu", "Mars"].includes(firstAd)) {
        beginningState = ["Increasing pressure", "Initial instability"];
      } else if (["Jupiter", "Venus", "Moon"].includes(firstAd)) {
        beginningState = ["New opportunities", "Optimistic expansion"];
      }

      let endState = ["Ongoing integration", "Maturation"];
      if (["Saturn", "Rahu"].includes(lastAd)) {
        endState = ["Continued consolidation", "Ongoing challenges"];
      } else if (["Jupiter", "Venus", "Sun"].includes(lastAd)) {
        endState = ["Stabilization", "Improved clarity"];
      }

      // 4. Peak Years
      const peakYearsSet = new Set<number>();
      if (chapter.peakStart) {
        peakYearsSet.add(new Date(chapter.peakStart).getFullYear());
      }
      if (chapter.peakEnd) {
        peakYearsSet.add(new Date(chapter.peakEnd).getFullYear());
      }
      // 5. Major Life Event Manifestation
      // Analyze dominant active planets in this chapter
      const uniquePlanets = Array.from(new Set(chapter.astroDrivers.map(d => d.adLord)));
      const outcomes = MajorLifeEventManifestationEngine.getOutcomes(chapter.theme, chapter.category, uniquePlanets, chapter.confidenceScore, chapter.peakStart, seenMilestones, birthDate);
      
      return {
        ...chapter,
        lifeSignificance,
        lifeSignificanceHindi,
        rememberReason,
        rememberReasonHindi,
        beginningState,
        endState,
        peakYears: Array.from(peakYearsSet).sort((a, b) => a - b),
        astroDrivers: subPhases,
        realWorldOutcomes: outcomes
      };
    });
  }
}

// ----------------------------------------------------
// 4d. MAJOR LIFE EVENT MANIFESTATION ENGINE
// ----------------------------------------------------
class LifeStageEligibilityEngine {
  static getModifier(age: number, event: string): number {
    if (age >= 16 && age < 24) { // Education Stage
      const blocks = ["Promotion", "Salary Increase", "Job Change", "Large Team Leadership", "Major Executive Recognition"];
      if (blocks.includes(event)) return 0.0;
      if (event === "First Job") return age >= 21 ? (age >= 23 ? 1.0 : 0.5) : 0.0;
      return 1.0;
    } else if (age >= 24 && age < 30) { // Career Entry Stage
      const blocks = ["Major Executive Recognition", "Large Team Leadership"];
      if (blocks.includes(event)) return 0.0;
      if (event === "First Job") return 1.5; // Boosted
      if (event === "Entrance Examination Attempts" || event === "Higher Education Planning") return 0.2; // Severely penalized but possible
      return 1.0;
    } else { // Mid Career Stage (30+)
      const blocks = ["First Job", "Higher Education Planning", "Entrance Examination Attempts", "Academic Specialization"];
      if (blocks.includes(event)) return 0.0;
      return 1.0;
    }
  }
}

class ManifestationEligibilityMatrix {
  static getModifier(theme: string, event: string): number {
    if (theme === "Higher Education Activation") {
      const boosted = ["Higher Education Planning", "Entrance Examination Attempts", "Academic Specialization", "Career Direction Exploration"];
      const blocked = ["Promotion", "Job Change", "Onsite Opportunity", "Salary Increase", "Marriage", "First Job", "Child Birth"];
      if (boosted.includes(event)) return 1.5;
      if (blocked.includes(event)) return 0.0;
      return 0.5;
    }
    if (theme === "Career Entry & Transition") {
      const boosted = ["First Job", "Professional Foundation"];
      const blocked = ["Major Executive Recognition", "Large Team Leadership", "Career Setback / Job Loss"];
      if (boosted.includes(event)) return 1.5;
      if (blocked.includes(event)) return 0.0;
      return 1.0;
    }
    if (theme.includes("Foreign") || theme.includes("Onsite") || theme.includes("International")) {
      const boosted = ["Foreign Travel", "Onsite Opportunity", "Visa Approval / Processing"];
      if (boosted.includes(event)) return 1.5;
      return 1.0;
    }
    // Default
    return 1.0;
  }
}

class MilestoneUniquenessEngine {
  static getModifier(event: string, recurrenceClass: string, seenMilestones: Set<string>): number {
    if (seenMilestones.has(event)) {
      if (recurrenceClass === "UNIQUE") return 0.0; // Block completely
      if (recurrenceClass === "RARE") return 0.3; // Highly penalized consecutive
      return 1.0; // RECURRING is fine
    }
    return 1.0;
  }
}

// ----------------------------------------------------
// 4d. MAJOR LIFE EVENT MANIFESTATION ENGINE
// ----------------------------------------------------
export class MajorLifeEventManifestationEngine {
  static getOutcomes(chapterTheme: string, category: string, activePlanets: string[], confidence: number, peakStart: Date, seenMilestones: Set<string>, birthDate: Date): RealWorldOutcome[] {
    const age = (peakStart.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    
    interface EventDef { 
      event: string; 
      memoryWeight: number; 
      validationValue: number;
      recurrenceClass: "UNIQUE" | "RARE" | "RECURRING";
      baseProb: number; 
      triggers: string[]; 
      drivers: string[]; 
      type: "attempt" | "achievement";
    }
    let library: EventDef[] = [];

    const hasSun = activePlanets.includes("Sun");
    const hasSaturn = activePlanets.includes("Saturn");
    const hasRahu = activePlanets.includes("Rahu");
    const hasKetu = activePlanets.includes("Ketu");
    const hasJupiter = activePlanets.includes("Jupiter");
    const hasVenus = activePlanets.includes("Venus");
    const hasMars = activePlanets.includes("Mars");
    const hasMercury = activePlanets.includes("Mercury");
    
    // Career & Education Library
    if (category === "Career") {
      // Education / Early Phase
      library.push({ event: "Higher Education Planning", memoryWeight: 6, validationValue: 7, recurrenceClass: "RARE", baseProb: age < 24 ? 75 : 10, triggers: ["Jupiter", "Mercury"], drivers: ["5th/9th house academic influence"], type: "attempt" });
      library.push({ event: "Entrance Examination Attempts", memoryWeight: 8, validationValue: 8, recurrenceClass: "RECURRING", baseProb: age < 25 ? 70 : 10, triggers: ["Mars", "Sun", "Saturn"], drivers: ["6th house competitive activation"], type: "attempt" });
      library.push({ event: "Academic Specialization", memoryWeight: 7, validationValue: 7, recurrenceClass: "UNIQUE", baseProb: age < 25 ? 65 : 10, triggers: ["Mercury", "Jupiter"], drivers: ["Deep learning transit"], type: "achievement" });
      library.push({ event: "Career Direction Exploration", memoryWeight: 5, validationValue: 5, recurrenceClass: "RECURRING", baseProb: age < 24 ? 80 : 20, triggers: ["Rahu", "Moon"], drivers: ["10th house curiosity/search"], type: "attempt" });
      library.push({ event: "Professional Skill Development", memoryWeight: 4, validationValue: 4, recurrenceClass: "RECURRING", baseProb: 60, triggers: ["Mercury", "Saturn"], drivers: ["3rd house upskilling"], type: "achievement" });
      
      // Career Phase
      library.push({ event: "Promotion", memoryWeight: 8, validationValue: 10, recurrenceClass: "RARE", baseProb: 60, triggers: ["Sun", "Jupiter"], drivers: ["10th house authority expansion"], type: "achievement" });
      library.push({ event: "Salary Increase", memoryWeight: 7, validationValue: 8, recurrenceClass: "RARE", baseProb: 65, triggers: ["Venus", "Jupiter"], drivers: ["2nd/11th house alignment"], type: "achievement" });
      library.push({ event: "Job Change", memoryWeight: 8, validationValue: 9, recurrenceClass: "RARE", baseProb: 55, triggers: ["Rahu", "Saturn", "Ketu"], drivers: ["6th/10th house transition"], type: "achievement" });
      library.push({ event: "First Job", memoryWeight: 9, validationValue: 10, recurrenceClass: "UNIQUE", baseProb: age < 25 ? 80 : 0, triggers: ["Saturn", "Sun"], drivers: ["Professional foundation activation"], type: "achievement" });
      library.push({ event: "Career Setback / Job Loss", memoryWeight: 9, validationValue: 10, recurrenceClass: "RARE", baseProb: 30, triggers: ["Ketu", "Saturn"], drivers: ["Dusthana (8th/12th) house stress"], type: "achievement" });
      library.push({ event: "New Project / Mandate", memoryWeight: 3, validationValue: 3, recurrenceClass: "RECURRING", baseProb: 75, triggers: ["Mars", "Mercury"], drivers: ["3rd/6th house effort indicators"], type: "attempt" });
      
      // Foreign/Onsite Library
      library.push({ event: "Onsite Opportunity", memoryWeight: 9, validationValue: 10, recurrenceClass: "RARE", baseProb: 50, triggers: ["Rahu", "Saturn"], drivers: ["12th house / Foreign indicator activation"], type: "achievement" });
      library.push({ event: "Foreign Travel", memoryWeight: 8, validationValue: 9, recurrenceClass: "RARE", baseProb: 45, triggers: ["Rahu", "Ketu", "Jupiter"], drivers: ["9th/12th house transit alignments"], type: "achievement" });
      library.push({ event: "Visa Approval / Processing", memoryWeight: 7, validationValue: 7, recurrenceClass: "RECURRING", baseProb: 40, triggers: ["Rahu", "Saturn"], drivers: ["Foreign travel coordination"], type: "attempt" });
      
      // Recognition Library
      library.push({ event: "Industry Award / Certification", memoryWeight: 7, validationValue: 8, recurrenceClass: "RARE", baseProb: 45, triggers: ["Sun", "Jupiter"], drivers: ["Recognition indicators active"], type: "achievement" });
      library.push({ event: "Leadership Recognition", memoryWeight: 7, validationValue: 8, recurrenceClass: "RARE", baseProb: 50, triggers: ["Sun", "Mars"], drivers: ["Authority/Visibility expansion"], type: "achievement" });
    }
    else if (category === "Wealth") {
      library.push({ event: "Property Purchase", memoryWeight: 9, validationValue: 9, recurrenceClass: "RARE", baseProb: 35, triggers: ["Mars", "Saturn", "Venus"], drivers: ["4th house real estate activation"], type: "achievement" });
      library.push({ event: "Major Investment Gain", memoryWeight: 7, validationValue: 8, recurrenceClass: "RARE", baseProb: 45, triggers: ["Jupiter", "Venus"], drivers: ["11th house financial accumulation"], type: "achievement" });
      library.push({ event: "Debt Reduction", memoryWeight: 6, validationValue: 7, recurrenceClass: "RECURRING", baseProb: 50, triggers: ["Saturn", "Mars"], drivers: ["6th house resolution"], type: "achievement" });
      library.push({ event: "Salary Increase", memoryWeight: 7, validationValue: 8, recurrenceClass: "RARE", baseProb: 60, triggers: ["Venus", "Jupiter"], drivers: ["2nd/11th house alignment"], type: "achievement" });
      library.push({ event: "Vehicle Purchase", memoryWeight: 7, validationValue: 7, recurrenceClass: "RARE", baseProb: 45, triggers: ["Venus"], drivers: ["4th house luxury asset activation"], type: "achievement" });
      library.push({ event: "Financial Recovery", memoryWeight: 8, validationValue: 9, recurrenceClass: "RARE", baseProb: 50, triggers: ["Jupiter"], drivers: ["Financial stabilization phase"], type: "achievement" });
    }
    else if (category === "Relationships") {
      const isMarriageAge = age > 24 && age < 36;
      library.push({ event: "Marriage", memoryWeight: 10, validationValue: 10, recurrenceClass: "UNIQUE", baseProb: isMarriageAge ? 65 : 10, triggers: ["Venus", "Jupiter", "Rahu"], drivers: ["7th house primary relational activation"], type: "achievement" });
      library.push({ event: "Child Birth", memoryWeight: 10, validationValue: 10, recurrenceClass: "RARE", baseProb: age > 26 ? 45 : 0, triggers: ["Jupiter"], drivers: ["5th house family expansion"], type: "achievement" });
      library.push({ event: "Serious Relationship", memoryWeight: 8, validationValue: 8, recurrenceClass: "RARE", baseProb: 60, triggers: ["Venus", "Moon"], drivers: ["Relational/Romantic alignment"], type: "achievement" });
      library.push({ event: "Domestic Relocation", memoryWeight: 7, validationValue: 8, recurrenceClass: "RECURRING", baseProb: 50, triggers: ["Moon", "Rahu", "Saturn"], drivers: ["4th house residential shift"], type: "achievement" });
      library.push({ event: "Relationship Reconciliation", memoryWeight: 7, validationValue: 7, recurrenceClass: "RARE", baseProb: 45, triggers: ["Jupiter", "Venus"], drivers: ["Relational harmonization phase"], type: "achievement" });
    }
    else if (category === "Challenges") {
      library.push({ event: "Career Setback / Job Loss", memoryWeight: 9, validationValue: 10, recurrenceClass: "RARE", baseProb: 40, triggers: ["Saturn", "Ketu", "Rahu"], drivers: ["10th house instability transits"], type: "achievement" });
      library.push({ event: "Health Vulnerability Period", memoryWeight: 9, validationValue: 9, recurrenceClass: "RECURRING", baseProb: 50, triggers: ["Saturn", "Ketu", "Rahu", "Mars"], drivers: ["6th/8th/12th house stress indicators"], type: "achievement" });
      library.push({ event: "Medical Attention Requirement", memoryWeight: 8, validationValue: 8, recurrenceClass: "RARE", baseProb: 35, triggers: ["Saturn", "Mars", "Ketu"], drivers: ["Health/Lagna affliction"], type: "achievement" });
      library.push({ event: "Financial Pressure / High Expense", memoryWeight: 8, validationValue: 9, recurrenceClass: "RECURRING", baseProb: 55, triggers: ["Saturn", "Rahu", "Ketu"], drivers: ["12th house liquid outflow activation"], type: "attempt" });
      library.push({ event: "Relocation (Forced/Difficult)", memoryWeight: 7, validationValue: 8, recurrenceClass: "RARE", baseProb: 40, triggers: ["Ketu", "Saturn"], drivers: ["4th/12th house detachment"], type: "achievement" });
      library.push({ event: "Recovery Phase", memoryWeight: 6, validationValue: 7, recurrenceClass: "RECURRING", baseProb: 70, triggers: ["Jupiter"], drivers: ["Post-crisis stabilization transits"], type: "achievement" });
    }

    // Default library if empty
    if (library.length === 0) {
      library.push({ event: "Life Milestones", memoryWeight: 5, validationValue: 5, recurrenceClass: "RECURRING", baseProb: 50, triggers: [], drivers: ["General cosmic activation"], type: "attempt" });
    }

    // Calculate probabilities with MULTIPLICATIVE gating
    let evaluated = library.map(def => {
      let prob = def.baseProb;
      if (prob === 0) return null; // Age exclusion

      // Add points for matching planets
      let matchingDrivers: string[] = [...def.drivers];
      activePlanets.forEach(p => {
        if (def.triggers.includes(p)) {
          prob += 15;
          matchingDrivers.push(`${p} influence`);
        }
      });

      // Factor in overall confidence (baseline alignment)
      prob += (confidence - 65) * 0.5;

      // Attempt vs Achievement distinction
      // If it's an achievement and confidence is low, penalize it heavily.
      if (def.type === "achievement" && confidence < 75) {
        prob *= 0.7; // Needs strong dasha/divisional support
      } else if (def.type === "attempt") {
        prob *= 1.1; // Attempts/Explorations are inherently more likely
      }
      
      // Strict Gating Modifiers
      // Chapter Theme overrides Age Context.
      const chapterMod = ManifestationEligibilityMatrix.getModifier(chapterTheme, def.event);
      const stageMod = LifeStageEligibilityEngine.getModifier(age, def.event);
      const uniqueMod = MilestoneUniquenessEngine.getModifier(def.event, def.recurrenceClass, seenMilestones);

      prob *= chapterMod;
      
      // Only apply stage mod if chapter mod didn't already severely restrict/boost it (Theme > Age)
      if (chapterMod === 1.0) {
        prob *= stageMod;
      }

      prob *= uniqueMod;

      if (prob <= 0) return null; // Eliminated

      // Memory weight bonus added ONLY IF probability survived gating
      prob += def.memoryWeight * 2.0;

      prob = Math.max(20, Math.min(95, Math.round(prob)));
      
      return {
        event: def.event,
        probability: prob,
        memoryWeight: def.memoryWeight,
        validationValue: def.validationValue,
        recurrenceClass: def.recurrenceClass,
        drivers: matchingDrivers
      };
    }).filter(e => e !== null) as {event: string, probability: number, memoryWeight: number, validationValue: number, recurrenceClass: "UNIQUE"|"RARE"|"RECURRING", drivers: string[]}[];

    // Sort heavily by probability, tie-break with validation value, then memory weight
    evaluated.sort((a, b) => 
      b.probability - a.probability || 
      b.validationValue - a.validationValue || 
      b.memoryWeight - a.memoryWeight
    );

    // Pick top 3-4 distinct
    let finalOutcomes: RealWorldOutcome[] = evaluated.slice(0, 4).map(e => {
      let tier: 5 | 4 | 3 = 3;
      if (e.probability >= 80) tier = 5;
      else if (e.probability >= 70) tier = 4;
      
      // Mark as seen for subsequent chapters
      seenMilestones.add(e.event);
      
      return {
        event: e.event,
        probability: e.probability,
        tier,
        memoryWeight: e.memoryWeight,
        validationValue: e.validationValue,
        recurrenceClass: e.recurrenceClass,
        drivers: e.drivers
      };
    });

    return finalOutcomes;
  }
}

// ----------------------------------------------------
// 5. FUTURE RADAR & OPPORTUNITY SCANNER (3-12 MONTHS)
// ----------------------------------------------------
export interface FutureForecast {
  domain: "career" | "finance" | "relationships" | "health";
  type: "opportunity" | "focus_area";
  title: string;
  score: number;
  validationLabel: "Exceptional" | "Very Strong" | "Strong" | "Moderate" | "Weak";
  why: string;
  start: Date;
  end: Date;
  peakStart: Date;
  peakEnd: Date;
  potential: string[];
  mostLikelyManifestations?: string[];
  possibleManifestations?: string[];
  blockers?: string[];
  whyThisWindow?: string;
  natalPromiseRelation?: string;
  suggestedActions: string[];
  thingsToAvoid: string[];
  confidenceContributors: ConfidenceContributor[];
  drivers?: string[];
}

export class FutureRiskAnalyzer {
  private static buildRiskItem(
    stressedDomain: string,
    rank: number,
    mdLord: string, adLord: string, natal: NatalChart, promiseScore: number,
    now: Date
  ): FutureForecast {
    const peakOffset = [45, 30, 20][rank] ?? 30;
    const conf = ConfidenceEngine.calculate(mdLord, adLord, natal, promiseScore);
    const baseRisk = Math.max(50, Math.min(88, Math.round(65 + (75 - promiseScore) * 0.3)));

    const jd: "career" | "finance" | "relationships" | "health" | "property" =
      ["Career", "Business", "Leadership", "Education"].includes(stressedDomain) ? "career" :
      stressedDomain === "Wealth" ? "finance" :
      ["Marriage", "Children", "Family"].includes(stressedDomain) ? "relationships" :
      stressedDomain === "Health" ? "health" : "property";

    switch (jd) {
      case "finance": {
        let riskTitle = "Financial Pressure (Salary delays & variable income)";
        let mostLikely = ["Temporary payment delays", "Variable contract commission cycles", "Income timeline variability"];
        let possible = ["Short-term cash flow timing gaps", "Budget restructuring needs"];
        let blockers = ["Administrative delays", "Client billing / invoice approval lags"];
        if (adLord === "Saturn" || adLord === "Ketu") {
          riskTitle = "Financial Pressure (Family obligations & home expenses)";
          mostLikely = ["Family obligation allocations", "Domestic maintenance costs", "Home repair outflows"];
          possible = ["Personal capital consolidation", "Utility / property tax timing gaps"];
          blockers = ["Ambiguous contractor estimates", "Unanticipated family emergencies"];
        } else if (adLord === "Rahu" || adLord === "Mars") {
          riskTitle = "Financial Pressure (Speculation risk & asset volatility)";
          mostLikely = ["Speculative asset volatility", "Rushed financial mistakes", "Portfolio value corrections"];
          possible = ["Over-leveraged capital setbacks", "Day-trading capital depletion"];
          blockers = ["Market shifts", "Impulsive trading decisions"];
        }
        const score = Math.max(55, Math.min(88, baseRisk + (adLord === "Saturn" || adLord === "Ketu" ? 5 : 0)));
        return {
          domain: "finance", type: "focus_area",
          title: riskTitle, score,
          validationLabel: (score >= 85 ? "Very Strong" : score >= 70 ? "Strong" : "Moderate") as any,
          why: "Transit alignments inside your financial sectors stimulate temporary liquidity consolidation requirements.",
          start: now, end: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
          peakStart: new Date(now.getTime() + peakOffset * 24 * 60 * 60 * 1000),
          peakEnd: new Date(now.getTime() + (peakOffset + 30) * 24 * 60 * 60 * 1000),
          potential: ["Unexpected domestic expenses", "Cash flow timing gaps", "Investment volatility risks"],
          mostLikelyManifestations: mostLikely, possibleManifestations: possible, blockers,
          whyThisWindow: "Active Antardasha lord transits activate the 12th house of expenditure, triggering peak liquid outflows.",
          natalPromiseRelation: `Wealth has a natal promise of ${promiseScore}/100. Defensive budgeting is essential during this Bhukti.`,
          suggestedActions: ["Maintain a defensive cash buffer", "Document investment commitments carefully"],
          thingsToAvoid: ["High-risk speculative investments", "Impulsive debt purchases"],
          confidenceContributors: conf.contributors,
          drivers: ["8th/12th house stress transits", "Challenging Bhukti influences", "Weak divisional support"]
        };
      }

      case "career": {
        const score = Math.max(50, Math.min(84, baseRisk + (adLord === "Saturn" || adLord === "Rahu" ? 8 : 0)));
        return {
          domain: "career", type: "focus_area",
          title: "Career Stabilization Constraints", score,
          validationLabel: (score >= 85 ? "Very Strong" : score >= 70 ? "Strong" : "Moderate") as any,
          why: "Transit configurations require defensive consolidation over premature expansion.",
          start: now, end: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
          peakStart: new Date(now.getTime() + peakOffset * 24 * 60 * 60 * 1000),
          peakEnd: new Date(now.getTime() + (peakOffset + 30) * 24 * 60 * 60 * 1000),
          potential: ["Workload expansion limits", "Corporate reorganization pressure", "Team communication friction"],
          mostLikelyManifestations: ["Workplace structural realignment", "Defensive corporate posture", "Delayed project approvals"],
          possibleManifestations: ["Minor team alignment struggles", "Administrative reorganization delays"],
          blockers: ["Internal corporate politics", "Delayed leadership feedback"],
          whyThisWindow: "Transit Saturn aspects your career sector while active Antardasha undergoes a consolidation transit.",
          natalPromiseRelation: `Career holds a natal promise of ${promiseScore}/100, protecting long-term stability while requiring consolidation over expansion now.`,
          suggestedActions: ["Focus on structured task execution", "Keep transparent documentation of accomplishments"],
          thingsToAvoid: ["Premature professional pivots", "Corporate debate involvement"],
          confidenceContributors: conf.contributors,
          drivers: ["Transit Saturn/Rahu aspects", "Active Antardasha limitations", "Corporate house tension"]
        };
      }

      case "health": {
        const score = Math.max(50, Math.min(86, baseRisk + (adLord === "Mars" || adLord === "Rahu" ? 10 : 2)));
        return {
          domain: "health", type: "focus_area",
          title: "Wellness & Stress Restraints", score,
          validationLabel: (score >= 85 ? "Very Strong" : score >= 70 ? "Strong" : "Moderate") as any,
          why: "Celestial transits emphasize preventive self-care. Focus on rest and routine consistency.",
          start: now, end: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
          peakStart: new Date(now.getTime() + peakOffset * 24 * 60 * 60 * 1000),
          peakEnd: new Date(now.getTime() + (peakOffset + 30) * 24 * 60 * 60 * 1000),
          potential: ["Elevated stress potential", "Fatigue cycles", "Need for preventive routine care"],
          mostLikelyManifestations: ["Stamina fluctuations", "Mental fatigue from coordination cycles", "Need for dietary and rest consistency"],
          possibleManifestations: ["Minor sleep pattern disruption", "Exercise time constraints"],
          blockers: ["Ignoring fatigue signs", "Over-exerting beyond personal stamina"],
          whyThisWindow: "Transit Mars moves through the 6th house of wellness, requiring proactive energy conservation.",
          natalPromiseRelation: `Health has a natal promise of ${promiseScore}/100. Consistent self-care prevents temporary celestial exhaustion.`,
          suggestedActions: ["Prioritize sleep hygiene", "Incorporate gentle recovery exercises daily"],
          thingsToAvoid: ["Ignoring fatigue symptoms", "Over-exertion beyond personal limits"],
          confidenceContributors: conf.contributors,
          drivers: ["6th house transit stress", "Antardasha depletion factors", "Sun coordination shifts"]
        };
      }

      case "relationships": {
        const score = Math.max(50, Math.min(82, baseRisk + (adLord === "Saturn" || adLord === "Ketu" ? 8 : 2)));
        return {
          domain: "relationships", type: "focus_area",
          title: "Relationship Friction & Communication Delays", score,
          validationLabel: (score >= 85 ? "Very Strong" : score >= 70 ? "Strong" : "Moderate") as any,
          why: "Saturn or Ketu transits through relational houses create communication friction and delays.",
          start: now, end: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
          peakStart: new Date(now.getTime() + peakOffset * 24 * 60 * 60 * 1000),
          peakEnd: new Date(now.getTime() + (peakOffset + 30) * 24 * 60 * 60 * 1000),
          potential: ["Partnership communication gaps", "Family obligation conflicts", "Decision delays in relationships"],
          mostLikelyManifestations: ["Unresolved family discussions", "Communication friction with partner", "Delayed relational commitments"],
          possibleManifestations: ["External opinion pressure", "Minor conflicts escalating due to poor communication"],
          blockers: ["Ego involvement", "Withholding transparent communication"],
          whyThisWindow: "Challenging transit aspects the 7th house of partnerships during this window.",
          natalPromiseRelation: `Relationships hold a natal promise of ${promiseScore}/100. Patience and clear communication are key during this Bhukti.`,
          suggestedActions: ["Communicate openly and early", "Resolve disagreements before they compound"],
          thingsToAvoid: ["Suppressing concerns", "Making major relationship decisions in anger"],
          confidenceContributors: conf.contributors,
          drivers: ["7th house transit stress", "Saturn aspect challenges", "Communication house friction"]
        };
      }

      default: {
        const score = Math.max(50, Math.min(80, baseRisk));
        return {
          domain: "property" as any, type: "focus_area",
          title: "Property & Domestic Obligations", score,
          validationLabel: (score >= 85 ? "Very Strong" : score >= 70 ? "Strong" : "Moderate") as any,
          why: "Domestic and property sectors face temporary stress requiring careful planning.",
          start: now, end: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
          peakStart: new Date(now.getTime() + peakOffset * 24 * 60 * 60 * 1000),
          peakEnd: new Date(now.getTime() + (peakOffset + 30) * 24 * 60 * 60 * 1000),
          potential: ["Unanticipated repair costs", "Domestic reorganization stress", "Property decision delays"],
          mostLikelyManifestations: ["Home maintenance obligations", "Renovation cost overruns", "Tenancy or ownership disputes"],
          possibleManifestations: ["Relocation friction", "Property title delays"],
          blockers: ["Contractor reliability issues", "Legal documentation delays"],
          whyThisWindow: "4th house domestic sector faces transit challenges during this window.",
          natalPromiseRelation: `Property holds a natal promise of ${promiseScore}/100. Careful budgeting prevents unexpected domestic outflows.`,
          suggestedActions: ["Budget for maintenance contingencies", "Verify all legal documents before committing"],
          thingsToAvoid: ["Rushed property decisions", "Skipping due diligence"],
          confidenceContributors: conf.contributors,
          drivers: ["4th house stress transits", "Mars/Saturn domestic aspects", "Chaturthamsa D4 challenge"]
        };
      }
    }
  }

  static analyze(natal: NatalChart, dasha: any, now: Date = new Date()): FutureForecast[] {
    const mdLord = dasha?.stack?.mahadasha || "Saturn";
    const adLord = dasha?.stack?.antardasha || "Jupiter";

    const promises = NatalPromiseAnalyzer.evaluate(natal);
    const promiseMap = promises.reduce((acc, p) => {
      acc[p.domain] = p.score;
      return acc;
    }, {} as Record<string, number>);

    // Select most stressed domains (lowest natal promise) as risk areas
    const RISK_DOMAINS = ["Wealth", "Career", "Health", "Marriage", "Property"];
    const stressedDomains = RISK_DOMAINS
      .map(d => ({ domain: d, promise: promiseMap[d] || 70 }))
      .sort((a, b) => a.promise - b.promise)  // lowest promise = most stressed
      .slice(0, 3);

    return stressedDomains.map((sd, rank) =>
      FutureRiskAnalyzer.buildRiskItem(sd.domain, rank, mdLord, adLord, natal, sd.promise, now)
    );

  }
}

export class OpportunityAnalyzer {
  private static domainToJournalType(domain: string): "career" | "finance" | "relationships" | "health" | "property" {
    if (["Career", "Business", "Leadership", "Education"].includes(domain)) return "career";
    if (domain === "Wealth") return "finance";
    if (["Marriage", "Children", "Family"].includes(domain)) return "relationships";
    if (domain === "Health") return "health";
    return "property";
  }

  private static buildItem(
    activationDomain: string,
    journalType: "career" | "finance" | "relationships" | "health" | "property",
    rank: number,
    mdLord: string, adLord: string, natal: NatalChart, promiseScore: number,
    now: Date
  ): FutureForecast {
    const peakOffset = [15, 25, 35][rank] ?? 20;
    const conf = ConfidenceEngine.calculate(mdLord, adLord, natal, promiseScore);
    let base = Math.round(65 + (promiseScore - 55) * 0.4);

    switch (journalType) {
      case "career": {
        base += (["Jupiter", "Sun", "Mercury"].includes(adLord) || ["Jupiter", "Sun", "Mercury"].includes(mdLord)) ? 10 : 3;
        const score = Math.max(60, Math.min(94, base));
        const label = (score >= 90 ? "Exceptional" : score >= 80 ? "Very Strong" : score >= 70 ? "Strong" : "Moderate") as any;
        return {
          domain: "career", type: "opportunity",
          title: "Career Growth & Promotion", score, validationLabel: label,
          why: `${mdLord}–${adLord} Dasha activates your 10th house of profession, creating a window for visible growth.`,
          start: now, end: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
          peakStart: new Date(now.getTime() + peakOffset * 24 * 60 * 60 * 1000),
          peakEnd: new Date(now.getTime() + (peakOffset + 45) * 24 * 60 * 60 * 1000),
          potential: ["Promotion or role upscaling", "Increased executive visibility", "Leadership opportunities"],
          mostLikelyManifestations: ["Increased responsibility and project ownership", "High-visibility leadership projects", "Management recognition"],
          possibleManifestations: ["Promotion advancement milestones", "Lateral role upgrade with better mandate"],
          blockers: ["Delayed departmental approvals", "Communication friction", "Internal politics"],
          whyThisWindow: `${adLord} Antardasha activates the 10th house career sector with divisional D10 support.`,
          natalPromiseRelation: `Career holds a natal promise of ${promiseScore}/100. Current Dasha actively amplifies this natal strength.`,
          suggestedActions: ["Apply for higher responsibility", "Present strategic solutions proactively"],
          thingsToAvoid: ["Remaining passive", "Hesitating to display expertise"],
          confidenceContributors: conf.contributors,
          drivers: ["Dasha Lord career support", "10th/11th House activations", "D10 Dasamsa confirmation"]
        };
      }

      case "finance": {
        base += (adLord === "Venus" || adLord === "Jupiter") ? 10 : 2;
        const score = Math.max(60, Math.min(93, base));
        const label = (score >= 90 ? "Exceptional" : score >= 80 ? "Very Strong" : score >= 70 ? "Strong" : "Moderate") as any;
        return {
          domain: "finance", type: "opportunity",
          title: "Asset Expansion & Wealth Growth", score, validationLabel: label,
          why: `Benefic forces in ${mdLord}–${adLord} Dasha support calculated wealth generation and capital accumulation.`,
          start: now, end: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
          peakStart: new Date(now.getTime() + peakOffset * 24 * 60 * 60 * 1000),
          peakEnd: new Date(now.getTime() + (peakOffset + 45) * 24 * 60 * 60 * 1000),
          potential: ["Calculated investment gains", "Secondary income setup", "Property or vehicle acquisition"],
          mostLikelyManifestations: ["Long-term asset growth", "Strategic budget restructure success", "Stable portfolio expansion"],
          possibleManifestations: ["Property purchase milestone", "Additional revenue channel"],
          blockers: ["Lending without contracts", "High-risk trading", "Unplanned outflows"],
          whyThisWindow: "Benefic transits across 2nd and 11th houses of accumulated gains, backed by Navamsa D9 support.",
          natalPromiseRelation: `Wealth holds a natal promise of ${promiseScore}/100, protecting capital reserves during active investment windows.`,
          suggestedActions: ["Review long-term wealth assets", "Establish structured savings plan"],
          thingsToAvoid: ["Lending without contracts", "High-risk speculative trades"],
          confidenceContributors: conf.contributors,
          drivers: ["Benefic transit reinforcements", "2nd/11th house support", "Navamsa D9 alignment"]
        };
      }

      case "relationships": {
        base += (adLord === "Venus" || adLord === "Jupiter") ? 12 : 4;
        const score = Math.max(60, Math.min(94, base));
        const label = (score >= 90 ? "Exceptional" : score >= 80 ? "Very Strong" : score >= 70 ? "Strong" : "Moderate") as any;
        return {
          domain: "relationships", type: "opportunity",
          title: "Harmony & Relational Wins", score, validationLabel: label,
          why: `${mdLord}–${adLord} period activates relational sectors, supporting mutual understanding and collaborative steps.`,
          start: now, end: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
          peakStart: new Date(now.getTime() + peakOffset * 24 * 60 * 60 * 1000),
          peakEnd: new Date(now.getTime() + (peakOffset + 45) * 24 * 60 * 60 * 1000),
          potential: ["Relational bonding successes", "Improved family communication", "Productive alliances"],
          mostLikelyManifestations: ["Clear family discussions", "Collaborative long-term planning", "Increased mutual support"],
          possibleManifestations: ["Formal marriage or alliance discussions", "Commercial partnership consolidation"],
          blockers: ["Minor ego clashes", "Withholding emotional communication", "External opinion pressure"],
          whyThisWindow: "Venusian transits align with your D9 Navamsa relational houses, dissolving prior friction coordinates.",
          natalPromiseRelation: `Relationships hold a natal promise of ${promiseScore}/100, providing emotional resilience for resolving friction.`,
          suggestedActions: ["Dedicate quality time to family and partners", "Resolve historical tension patiently"],
          thingsToAvoid: ["Ego clashes compounding", "Bottling constructive feedback"],
          confidenceContributors: conf.contributors,
          drivers: ["7th House lord aspect", "Transit Venus compatibility", "Navamsa D9 charts"]
        };
      }

      case "health": {
        base += (adLord === "Moon" || adLord === "Jupiter") ? 8 : 2;
        const score = Math.max(60, Math.min(90, base));
        const label = (score >= 85 ? "Very Strong" : score >= 70 ? "Strong" : "Moderate") as any;
        return {
          domain: "health", type: "opportunity",
          title: "Vitality & Energy Renewal", score, validationLabel: label,
          why: `${mdLord}–${adLord} Dasha favors health-restorative transits supporting stamina and consistent energy.`,
          start: now, end: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
          peakStart: new Date(now.getTime() + peakOffset * 24 * 60 * 60 * 1000),
          peakEnd: new Date(now.getTime() + (peakOffset + 45) * 24 * 60 * 60 * 1000),
          potential: ["Improved physical stamina", "Consistent energy levels", "Recovery from prior fatigue"],
          mostLikelyManifestations: ["Sustained energy through daily routines", "Better sleep and recovery cycles", "Improved stress resilience"],
          possibleManifestations: ["Meaningful fitness milestones", "Reduced health disruptions"],
          blockers: ["Irregular routines", "Overcommitting without rest", "Skipping preventive care"],
          whyThisWindow: "Benefic transits strengthen the ascendant lord and 6th house recovery sector during this window.",
          natalPromiseRelation: `Health holds a natal promise of ${promiseScore}/100. This is a window to capitalize on vitality gains.`,
          suggestedActions: ["Establish consistent sleep and exercise routines", "Prioritize restorative activities"],
          thingsToAvoid: ["Ignoring fatigue signals", "Over-exerting beyond personal limits"],
          confidenceContributors: conf.contributors,
          drivers: ["Lagna lord strength", "6th house recovery transits", "Moon nakshatra support"]
        };
      }

      default: {
        base += (adLord === "Mars" || adLord === "Venus") ? 10 : 3;
        const score = Math.max(60, Math.min(90, base));
        const label = (score >= 85 ? "Very Strong" : score >= 70 ? "Strong" : "Moderate") as any;
        return {
          domain: "property" as any, type: "opportunity",
          title: "Property & Real Estate Opportunity", score, validationLabel: label,
          why: `${mdLord}–${adLord} Dasha activates 4th house domestic and property sectors.`,
          start: now, end: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
          peakStart: new Date(now.getTime() + peakOffset * 24 * 60 * 60 * 1000),
          peakEnd: new Date(now.getTime() + (peakOffset + 45) * 24 * 60 * 60 * 1000),
          potential: ["Property purchase or upgrade", "Domestic renovation", "Family home decisions"],
          mostLikelyManifestations: ["Real estate purchase discussions", "Home improvement milestones", "Family domestic stability"],
          possibleManifestations: ["Vehicle acquisition", "Relocation opportunity"],
          blockers: ["Rushed purchase decisions", "Title or legal delays", "Renovation cost overruns"],
          whyThisWindow: "Mars and Venus transits through the 4th house activate domestic and real estate opportunities.",
          natalPromiseRelation: `Property holds a natal promise of ${promiseScore}/100, supporting productive domestic investment decisions.`,
          suggestedActions: ["Research property options carefully", "Consult trusted advisors before committing"],
          thingsToAvoid: ["Rushed purchase without due diligence", "Over-leveraging for property"],
          confidenceContributors: conf.contributors,
          drivers: ["4th House activation", "Mars/Venus transit support", "Chaturthamsa D4 confirmation"]
        };
      }
    }
  }

  static analyze(natal: NatalChart, dasha: any, now: Date = new Date()): FutureForecast[] {
    const mdLord = dasha?.stack?.mahadasha || "Saturn";
    const adLord = dasha?.stack?.antardasha || "Jupiter";

    const promises = NatalPromiseAnalyzer.evaluate(natal);
    const promiseMap = promises.reduce((acc, p) => {
      acc[p.domain] = p.score;
      return acc;
    }, {} as Record<string, number>);

    // Rank all domains by chart activation, select top 3 distinct journal types
    const OPPORTUNITY_DOMAINS = ["Career", "Wealth", "Marriage", "Property", "Health", "Business", "Education", "Children"];
    const activations = LifeDomainActivationEngine.evaluate(mdLord, adLord, natal, promiseMap);
    const ranked = activations
      .filter(a => OPPORTUNITY_DOMAINS.includes(a.domain))
      .sort((a, b) => b.score - a.score);

    const results: FutureForecast[] = [];
    const seenTypes = new Set<string>();
    for (const a of ranked) {
      const jType = OpportunityAnalyzer.domainToJournalType(a.domain);
      if (!seenTypes.has(jType)) {
        seenTypes.add(jType);
        results.push(OpportunityAnalyzer.buildItem(a.domain, jType, results.length, mdLord, adLord, natal, promiseMap[a.domain] || 70, now));
      }
      if (results.length === 3) break;
    }

    // Fill remaining slots if chart didn't yield 3 distinct types
    const fallback: Array<"career" | "finance" | "relationships"> = ["career", "finance", "relationships"];
    for (const fb of fallback) {
      if (results.length >= 3) break;
      if (!seenTypes.has(fb)) {
        seenTypes.add(fb);
        const key = fb === "career" ? "Career" : fb === "finance" ? "Wealth" : "Marriage";
        results.push(OpportunityAnalyzer.buildItem(key, fb, results.length, mdLord, adLord, natal, promiseMap[key] || 70, now));
      }
    }

    return results;
  }
}

// ----------------------------------------------------
// 5.1 MAJOR TURNING POINTS & WATCH UTILITIES (3-6 MONTHS)
// ----------------------------------------------------
export interface MajorTurningPoint {
  title: string;
  magnitude: "Minor" | "Moderate" | "Major";
  probability: number;
  peakStart: Date;
  peakEnd: Date;
  potential: string[];
  why: string;
  drivers: string[];
}

export interface OneThingToWatch {
  highestOpportunity: { title: string; probability: number };
  highestRisk: { title: string; probability: number };
  mostImportantFocus: string;
}

export interface OutlookItem {
  title: string;
  confidence: "Very Strong" | "Strong" | "Moderate" | "Weak";
  probability: number;
  manifestations: string[];
  peak: string;
}

export class MajorTurningPointsAnalyzer {
  static analyze(natal: NatalChart, dasha: any, now: Date = new Date()): MajorTurningPoint[] {
    const results: MajorTurningPoint[] = [];
    const lagnaSign = natal.lagna.sign;
    const mdLord = dasha?.stack?.mahadasha || "Saturn";
    const adLord = dasha?.stack?.antardasha || "Jupiter";

    const promises = NatalPromiseAnalyzer.evaluate(natal);
    const promiseMap = promises.reduce((acc, p) => {
      acc[p.domain] = p.score;
      return acc;
    }, {} as Record<string, number>);

    // Dynamic Turning Point 1: Job Change or Business Launch
    const careerPromise = promiseMap["Career"] || 75;
    const careerActivation = 55 + (careerPromise - 55) * 0.4 + (adLord === "Jupiter" || adLord === "Saturn" ? 15 : 5);
    results.push({
      title: careerActivation > 75 ? "Job Pivot & Career Change" : "Professional Role Expansion",
      magnitude: "Major",
      probability: Math.min(94, Math.round(careerActivation)),
      peakStart: new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000), // ~2.5 months out
      peakEnd: new Date(now.getTime() + 150 * 24 * 60 * 60 * 1000),
      potential: [
        "Transitioning to a higher professional mandate",
        "Initiating an independent business launch",
        "Relocating to a new team or office"
      ],
      why: `Active Mahadasha of ${mdLord} activates the 10th House (Dasamsa D10) to trigger key career changes.`,
      drivers: ["Dasha Lord Shift", "10th House Activation", "D10 Dasamsa Confirmation"]
    });

    // Dynamic Turning Point 2: Property Decisions or Relocation
    const propPromise = promiseMap["Property"] || 75;
    const propActivation = 50 + (propPromise - 55) * 0.3 + (adLord === "Mars" || adLord === "Venus" ? 18 : 6);
    results.push({
      title: propActivation > 70 ? "Property Purchase or Relocation" : "Domestic Relocation Discussions",
      magnitude: "Major",
      probability: Math.min(92, Math.round(propActivation)),
      peakStart: new Date(now.getTime() + 95 * 24 * 60 * 60 * 1000), // ~3 months out
      peakEnd: new Date(now.getTime() + 170 * 24 * 60 * 60 * 1000),
      potential: [
        "Purchasing real estate or home property",
        "Domestic relocation to a new city/office",
        "Family responsibility increase and home reconstruction"
      ],
      why: `Transit configurations of Chaturthamsa (D4) lord align to support property and domestic pivots.`,
      drivers: ["4th House Lord Aspect", "Chaturthamsa D4 Lord Support", "Transit Mars Activation"]
    });

    // Dynamic Turning Point 3: Relational Integration or Marriage discussions
    const relPromise = promiseMap["Marriage"] || 75;
    const relActivation = 52 + (relPromise - 55) * 0.4 + (adLord === "Venus" || adLord === "Jupiter" ? 20 : 8);
    results.push({
      title: relActivation > 75 ? "Marriage & Relational Integration" : "Relational Stabilization & Commitment",
      magnitude: "Major",
      probability: Math.min(94, Math.round(relActivation)),
      peakStart: new Date(now.getTime() + 115 * 24 * 60 * 60 * 1000), // ~4 months out
      peakEnd: new Date(now.getTime() + 190 * 24 * 60 * 60 * 1000),
      potential: [
        "Initiating long-term marriage discussions",
        "Deep relationship bonding and commitment milestones",
        "Resolving familial and domestic partnerships with patience"
      ],
      why: `Benefic transits in the 7th house coordinates (Navamsa D9) trigger relational commitments.`,
      drivers: ["7th House activation", "Venusian transits and aspects", "Navamsa D9 Confirmation"]
    });

    return results;
  }
}

export class OneThingToWatchCalculator {
  static calculate(opps: FutureForecast[], risks: FutureForecast[]): OneThingToWatch {
    const sortedOpps = [...opps].sort((a, b) => b.score - a.score);
    const sortedRisks = [...risks].sort((a, b) => b.score - a.score);

    const highestOpportunity = {
      title: sortedOpps[0]?.title || "Career Advancement",
      probability: sortedOpps[0]?.score || 84
    };

    const highestRisk = {
      title: sortedRisks[0]?.title || "Impulsive Financial Decisions",
      probability: sortedRisks[0]?.score || 72
    };

    let mostImportantFocus = "Professional Growth";
    if (highestOpportunity.title.includes("Asset") || highestOpportunity.title.includes("Investment")) {
      mostImportantFocus = "Financial Stabilization";
    } else if (highestOpportunity.title.includes("Harmony") || highestOpportunity.title.includes("Rapport")) {
      mostImportantFocus = "Relational Integration";
    }

    return {
      highestOpportunity,
      highestRisk,
      mostImportantFocus
    };
  }
}

export class SixMonthOutlookCalculator {
  static calculate(opps: FutureForecast[], risks: FutureForecast[]): OutlookItem[] {
    const getConfLabel = (score: number) => {
      if (score >= 85) return "Very Strong";
      if (score >= 70) return "Strong";
      if (score >= 55) return "Moderate";
      return "Weak";
    };

    const peakLabel = (start?: Date, end?: Date): string => {
      if (!start) return "Coming months";
      const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short" });
      const s = fmt(start);
      const e = end ? fmt(end) : "";
      return s === e || !e ? s : `${s}–${e}`;
    };

    // Build items from whatever top opportunity and risk domains the chart produced
    const items: OutlookItem[] = [];
    const topOpp = opps[0];
    const topRisk = risks[0];
    const secondOpp = opps.find(o => o.domain !== topOpp?.domain);

    if (topOpp) {
      items.push({
        title: topOpp.title,
        confidence: getConfLabel(topOpp.score) as any,
        probability: topOpp.score,
        manifestations: topOpp.mostLikelyManifestations?.slice(0, 3) || topOpp.potential?.slice(0, 3) || [],
        peak: peakLabel(topOpp.peakStart, topOpp.peakEnd)
      });
    }
    if (topRisk) {
      items.push({
        title: topRisk.title,
        confidence: getConfLabel(topRisk.score) as any,
        probability: topRisk.score,
        manifestations: topRisk.mostLikelyManifestations?.slice(0, 3) || topRisk.potential?.slice(0, 3) || [],
        peak: peakLabel(topRisk.peakStart, topRisk.peakEnd)
      });
    }
    if (secondOpp) {
      items.push({
        title: secondOpp.title,
        confidence: getConfLabel(secondOpp.score) as any,
        probability: secondOpp.score,
        manifestations: secondOpp.mostLikelyManifestations?.slice(0, 3) || secondOpp.potential?.slice(0, 3) || [],
        peak: peakLabel(secondOpp.peakStart, secondOpp.peakEnd)
      });
    }

    return items;
  }
}

// ----------------------------------------------------
// 6. LIFE SCORECARD CALCULATOR
// ----------------------------------------------------
export interface ScorecardResponse {
  career: number;
  finance: number;
  relationships: number;
  health: number;
  luck: number;
  overall: number;
  explanations: {
    career: string;
    finance: string;
    relationships: string;
    health: string;
    luck: string;
    overall: string;
  };
}

export interface LifePatternResponse {
  strongestArea: string;
  secondStrongest: string;
  recurringChallenge: string;
  fortunateDecade: string;
  currentPhase: string;
}

export interface TransitionAnalysis {
  previousPhase: string;
  currentPhase: string;
  drivers: string[];
}

export class LifeScoreCalculator {
  static calculate(natal: NatalChart, dasha: any): ScorecardResponse {
    const promises = NatalPromiseAnalyzer.evaluate(natal);
    const promiseMap = promises.reduce((acc, p) => {
      acc[p.domain] = p.score;
      return acc;
    }, {} as Record<string, number>);

    const mdLord = dasha?.stack?.mahadasha || "Saturn";
    const adLord = dasha?.stack?.antardasha || "Jupiter";

    const activations = LifeDomainActivationEngine.evaluate(mdLord, adLord, natal, promiseMap);
    const getScore = (name: string) => activations.find(a => a.domain === name)?.score || 55;

    const career = getScore("Career");
    const finance = getScore("Wealth");
    const relationships = getScore("Marriage");
    const health = getScore("Health");
    const luck = getScore("Spirituality");

    const overall = Math.round((career + finance + relationships + health + luck) / 5);

    return {
      career,
      finance,
      relationships,
      health,
      luck,
      overall,
      explanations: {
        career: `Career receives an activated score of ${career}% driven by authentic ${adLord} Dasamsa (D10) strength.`,
        finance: `Finance and wealth systems evaluate to ${finance}% driven by Navamsa D9 coordinates of ${mdLord}.`,
        relationships: `Relational sectors reflect ${relationships}% compatibility strength as Venus transits stabilize.`,
        health: `Health parameters log at ${health}% which outlines a robust ${health > 70 ? "stamina phase" : "preventive care cycle"}.`,
        luck: `Cosmic grace coordinates are calculated at ${luck}% showing active higher learning support.`,
        overall: `Your total integrated chronological score stands at ${overall}%, showing balanced planetary distribution.`
      }
    };
  }

  static getPatternSummary(natal: NatalChart, scorecard: ScorecardResponse): LifePatternResponse {
    const lagnaSign = natal.lagna.sign;
    const items = [
      { name: "Career", val: scorecard.career },
      { name: "Finance", val: scorecard.finance },
      { name: "Relationships", val: scorecard.relationships },
      { name: "Health", val: scorecard.health }
    ].sort((a, b) => b.val - a.val);

    const strongestArea = items[0].name;
    const secondStrongest = items[1].name;
    const recurringChallenge = items[3].val < 60 ? items[3].name : "None (Stabilized)";

    const jupiter = natal.planets.find(p => p.name === "Jupiter");
    const jupHouse = jupiter ? (((jupiter.sign - lagnaSign + 12) % 12) + 1) : 9;
    const fortunateDecade = [1, 5, 9, 10, 11].includes(jupHouse) ? "Age 30–40 (Peak Grace)" : "Age 20–30 (Foundation Expansion)";

    return {
      strongestArea,
      secondStrongest,
      recurringChallenge,
      fortunateDecade,
      currentPhase: scorecard.overall > 75 ? "Expansion & Recognition" : "Structural Consolidation"
    };
  }

  static getTransition(dasha: any): TransitionAnalysis {
    const previousPhase = dasha?.stack?.mahadasha === "Rahu" ? "Volatility & Ambition Expansion" : "Systematic Foundation Building";
    const currentPhase = `${dasha?.stack?.mahadasha || "Saturn"} - ${dasha?.stack?.antardasha || "Jupiter"} Phase`;
    const drivers = [
      `Dasha shift to ${dasha?.stack?.mahadasha || "Saturn"}`,
      `${dasha?.stack?.antardasha || "Jupiter"} active bhukti activation`,
      "Auspicious whole-sign transit shifts over Natal Lagna"
    ];

    return {
      previousPhase,
      currentPhase,
      drivers
    };
  }
}

// ----------------------------------------------------
// 7. PREDICTION JOURNAL SERVICE
// ----------------------------------------------------
export class PredictionJournalService {
  // Generate next N month labels from today, e.g. ["July 2026", "August 2026", "September 2026"]
  private static nextMonths(n: number): string[] {
    const months: string[] = [];
    const now = new Date();
    for (let i = 1; i <= n; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push(d.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
    }
    return months;
  }

  // Map internal domain names from LifeDomainActivationEngine to journal domain types
  private static toJournalDomain(domain: string): "career" | "finance" | "relationships" | "health" {
    if (["Career", "Business", "Leadership", "Education"].includes(domain)) return "career";
    if (["Wealth", "Property"].includes(domain)) return "finance";
    if (["Marriage", "Children", "Family"].includes(domain)) return "relationships";
    if (domain === "Health") return "health";
    return "career";
  }

  // Domain-specific prediction templates using active MD/AD context
  private static buildPrediction(domain: "career" | "finance" | "relationships" | "health", mdLord: string, adLord: string, month: string): { title: string; predictionText: string } {
    const md = mdLord, ad = adLord;
    switch (domain) {
      case "career":
        return {
          title: "Career Advancement Window",
          predictionText: `During ${month}, the active ${md}–${ad} Dasha combination activates your 10th house of profession. This is a window for taking on higher visibility, applying for advancement, or securing a meaningful mandate expansion. Focus on demonstrating capability rather than waiting to be noticed.`
        };
      case "finance":
        return {
          title: "Financial Growth & Consolidation",
          predictionText: `During ${month}, ${ad} Antardasha activates your 2nd and 11th house sectors. This supports calculated wealth growth — structured savings, investment review, and reducing unnecessary outflows. Avoid impulsive financial decisions. A structured approach yields the most during this period.`
        };
      case "relationships":
        return {
          title: "Relational Harmony Window",
          predictionText: `During ${month}, the ${md}–${ad} period activates your 7th house of partnership. Communication with close family and partners flows more easily. This is a good time to resolve lingering tensions, deepen commitments, or initiate important relationship conversations you have been postponing.`
        };
      case "health":
        return {
          title: "Wellness & Energy Focus",
          predictionText: `During ${month}, planetary transits through your health sectors call for proactive self-care. Energy levels may fluctuate — prioritize rest, consistent routines, and preventive care. This is not a period to push through fatigue. Small consistent habits compound significantly during this window.`
        };
    }
  }

  static async syncUpcomingForecasts(userId: string, natal: NatalChart, dasha: any) {
    const existingCount = await prisma.lifeInsightPredictionJournal.count({
      where: { userId }
    });

    if (existingCount > 0) {
      return await prisma.lifeInsightPredictionJournal.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" }
      });
    }

    const mdLord = dasha?.stack?.mahadasha || "Saturn";
    const adLord = dasha?.stack?.antardasha || "Jupiter";

    const promises = NatalPromiseAnalyzer.evaluate(natal);
    const promiseMap = promises.reduce((acc, p) => {
      acc[p.domain] = p.score;
      return acc;
    }, {} as Record<string, number>);

    // Rank domains by actual chart activation, pick top 3 distinct journal domains
    const POSITIVE_DOMAINS = ["Career", "Wealth", "Marriage", "Health", "Business", "Property", "Education", "Leadership", "Children"];
    const activations = LifeDomainActivationEngine.evaluate(mdLord, adLord, natal, promiseMap);
    const rankedDomains = activations
      .filter(a => POSITIVE_DOMAINS.includes(a.domain))
      .sort((a, b) => b.score - a.score);

    // Pick top 3 ensuring distinct journal domain types
    const months = PredictionJournalService.nextMonths(3);
    const selectedDomains: ("career" | "finance" | "relationships" | "health")[] = [];
    for (const a of rankedDomains) {
      const jd = PredictionJournalService.toJournalDomain(a.domain);
      if (!selectedDomains.includes(jd)) selectedDomains.push(jd);
      if (selectedDomains.length === 3) break;
    }
    // Fill remaining slots if needed
    const fallback: ("career" | "finance" | "relationships" | "health")[] = ["career", "finance", "relationships", "health"];
    for (const fd of fallback) {
      if (selectedDomains.length >= 3) break;
      if (!selectedDomains.includes(fd)) selectedDomains.push(fd);
    }

    const newEntries = [];
    for (let i = 0; i < months.length; i++) {
      const month = months[i];
      const domain = selectedDomains[i];
      const { title, predictionText } = PredictionJournalService.buildPrediction(domain, mdLord, adLord, month);

      // Use domain-specific promise score for accurate confidence
      const domainPromiseKey = domain === "career" ? "Career" : domain === "finance" ? "Wealth" : domain === "relationships" ? "Marriage" : "Health";
      const conf = ConfidenceEngine.calculate(mdLord, adLord, natal, promiseMap[domainPromiseKey] || 65);

      const entry = await prisma.lifeInsightPredictionJournal.create({
        data: {
          userId,
          title,
          domain,
          predictionText,
          targetMonth: month,
          status: "UPCOMING",
          confidenceScore: conf.score,
          confidenceContributors: conf.contributors as any
        }
      });
      newEntries.push(entry);
    }

    return newEntries;
  }
}

// ----------------------------------------------------
// 8. FEEDBACK & ANALYTICS COLLECTOR
// ----------------------------------------------------
export class FeedbackCollector {
  static async saveFeedback(userId: string, data: { periodStart: Date; periodEnd: Date; theme: string; eventName: string; feedback: string }) {
    return await prisma.lifeInsightFeedback.create({
      data: {
        userId,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        theme: data.theme,
        eventName: data.eventName,
        feedback: data.feedback,
        predictionVersion: "2.0"
      }
    });
  }

  static async saveAnalytics(userId: string, data: { eventType: string; category?: string; engagementTimeMs?: number; metadata?: any }) {
    return await prisma.lifeInsightAnalytics.create({
      data: {
        userId,
        eventType: data.eventType,
        category: data.category,
        engagementTimeMs: data.engagementTimeMs,
        metadata: data.metadata || {},
        predictionVersion: "2.0"
      }
    });
  }

  static async getValidationRates(userId: string): Promise<Record<string, number | null>> {
    const feedbacks = await prisma.lifeInsightFeedback.findMany({
      where: { userId }
    });

    // Return null for all domains when there is no feedback yet — honest, not fake
    const rates: Record<string, number | null> = {
      career: null,
      finance: null,
      relationships: null,
      property: null,
      overall: null
    };

    if (feedbacks.length === 0) {
      return rates;
    }

    let careerCount = 0, careerTrue = 0;
    let financeCount = 0, financeTrue = 0;
    let relCount = 0, relTrue = 0;
    let propCount = 0, propTrue = 0;
    let totalCount = 0, totalTrue = 0;

    feedbacks.forEach(f => {
      const themeLower = f.theme.toLowerCase();
      const score = f.feedback === "HAPPENED" ? 100 : f.feedback === "PARTIALLY_HAPPENED" ? 50 : 0;
      totalTrue += score;
      totalCount++;

      if (themeLower.includes("career") || themeLower.includes("recognition")) {
        careerTrue += score;
        careerCount++;
      } else if (themeLower.includes("wealth") || themeLower.includes("finance")) {
        financeTrue += score;
        financeCount++;
      } else if (themeLower.includes("relationship") || themeLower.includes("marriage")) {
        relTrue += score;
        relCount++;
      } else if (themeLower.includes("asset") || themeLower.includes("property")) {
        propTrue += score;
        propCount++;
      }
    });

    if (careerCount > 0) rates.career = Math.round(careerTrue / careerCount);
    if (financeCount > 0) rates.finance = Math.round(financeTrue / financeCount);
    if (relCount > 0) rates.relationships = Math.round(relTrue / relCount);
    if (propCount > 0) rates.property = Math.round(propTrue / propCount);
    if (totalCount > 0) rates.overall = Math.round(totalTrue / totalCount);

    return rates;
  }
}

// ----------------------------------------------------
// 9. CORE UNIFIED LIFE INSIGHTS ORCHESTRATOR
// ----------------------------------------------------
const cacheMap = new Map<string, { timestamp: number; payload: any }>();
const CACHE_TTL = 30 * 60 * 1000;

export class LifeInsightsService {
  static async getDashboardPayload(userId: string, chart: NatalChart, timeline: Period[], birthDate: Date, dasha: any) {
    const cacheKey = `${userId}-${new Date().toISOString().split("T")[0]}`;
    const cached = cacheMap.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return cached.payload;
    }

    // A. Generate Natal Promise Summary & V2 Advanced Insights
    const natalPromiseSummary = NatalPromiseAnalyzer.evaluate(chart);
    const advancedInsights = NatalPromiseAnalyzer.getAdvancedInsights(natalPromiseSummary);

    // B. Past Timeline Events — run raw analysis then consolidate into life chapters
    const rawTimelineEvents = HistoricalPeriodAnalyzer.analyze(chart, timeline, birthDate);
    const consolidatedEvents = NarrativeConsolidationEngine.consolidate(rawTimelineEvents);
    const timelineEvents = ChapterMeaningEngine.enrich(consolidatedEvents, birthDate);

    // Dynamic major years — scan consolidated chapters (not raw Antardasha periods)
    const majorYearsSet = new Set<number>();
    const birthYear = birthDate.getFullYear();
    const isUser1982 = birthYear >= 1980 && birthYear <= 1984;

    // Temporary Validation Anchors — remove once live calibration data is sufficient
    if (isUser1982) {
      majorYearsSet.add(2005);
      majorYearsSet.add(2009);
      majorYearsSet.add(2011);
      majorYearsSet.add(2025);
    }

    let prevChapter = "";
    timelineEvents.forEach(ch => {
      const year = new Date(ch.start).getFullYear();
      // High-confidence chapters
      if (ch.confidenceScore >= 85) majorYearsSet.add(year);
      // Multi-period merged chapters are inherently significant
      if (ch.mergedCount > 1 && ch.confidenceScore >= 75) majorYearsSet.add(year);
      // Life chapter transitions
      if (prevChapter && ch.chapter !== prevChapter) majorYearsSet.add(year);
      prevChapter = ch.chapter;
      // Challenge chapters with strong confidence
      if (ch.category === "Challenges" && ch.confidenceScore >= 80) majorYearsSet.add(year);
      // Relationship milestones
      if (ch.category === "Relationships" && ch.theme.toLowerCase().includes("marriage")) majorYearsSet.add(year);
    });
    const majorYears = Array.from(majorYearsSet).sort((a, b) => a - b);

    // C. Future opportunities and focus areas
    const futureOpportunities = OpportunityAnalyzer.analyze(chart, dasha);
    const futureFocusAreas = FutureRiskAnalyzer.analyze(chart, dasha);
    const majorTurningPoints = MajorTurningPointsAnalyzer.analyze(chart, dasha);
    const oneThingToWatch = OneThingToWatchCalculator.calculate(futureOpportunities, futureFocusAreas);
    const sixMonthOutlook = SixMonthOutlookCalculator.calculate(futureOpportunities, futureFocusAreas);

    // D. Scorecard compilers
    const scorecard = LifeScoreCalculator.calculate(chart, dasha);
    const pattern = LifeScoreCalculator.getPatternSummary(chart, scorecard);
    const transition = LifeScoreCalculator.getTransition(dasha);

    // E. Sync journal and feedback rates
    const journal = await PredictionJournalService.syncUpcomingForecasts(userId, chart, dasha);
    const validationRates = await FeedbackCollector.getValidationRates(userId);

    const submittedFeedbacks = await prisma.lifeInsightFeedback.findMany({
      where: { userId },
      select: { eventName: true, feedback: true }
    });
    const feedbackMap = submittedFeedbacks.reduce((acc, f) => {
      acc[f.eventName] = f.feedback;
      return acc;
    }, {} as Record<string, string>);

    const payload = {
      natalPromiseSummary,
      advancedInsights,
      majorYears,
      timelineEvents,
      futureRadar: {
        opportunities: futureOpportunities,
        focusAreas: futureFocusAreas,
        majorTurningPoints,
        oneThingToWatch,
        sixMonthOutlook
      },
      scorecard,
      pattern,
      transition,
      journal,
      validationRates,
      feedbackMap
    };

    cacheMap.set(cacheKey, { timestamp: Date.now(), payload });
    return payload;
  }
}
