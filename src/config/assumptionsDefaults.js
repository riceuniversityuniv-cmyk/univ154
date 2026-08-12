// Fallback default legislative/financial constants, used by
// AssumptionsContext.jsx before the first Supabase fetch resolves or if it
// fails (same defensive pattern as WeekAccessContext.jsx's
// createDefaultWeekSettings()). These are the same values seeded into the
// assumptions_scalars / assumptions_brackets / assumptions_rmd_divisors
// tables by supabase/migrations/20260812000000_create_assumptions.sql,
// extracted directly from the live master Excel workbook's "Assumptions"
// tab -- keep in sync with that migration if the seed data ever changes.
// Once an admin edits a value in the Assumptions admin tab, the live DB
// value (not this file) is what the app actually uses.

export const ASSUMPTIONS_DEFAULTS = {
  "scalars": {
    "ss_rate": 0.062,
    "ss_wage_base": 176100,
    "medicare_rate": 0.0145,
    "addl_medicare_rate": 0.009,
    "addl_medicare_threshold": 200000,
    "std_deduction_single": 16100,
    "limit_401k": 24500,
    "limit_ira": 7500,
    "rmd_start_age": 73,
    "penalty_free_withdrawal_age": 59.5,
    "cpi_inflation": 0.03,
    "portfolio_return": 0.07
  },
  "federalOrdinaryBrackets": [
    {
      "lower": 0,
      "upper": 12400,
      "rate": 0.1
    },
    {
      "lower": 12400,
      "upper": 50400,
      "rate": 0.12
    },
    {
      "lower": 50400,
      "upper": 105700,
      "rate": 0.22
    },
    {
      "lower": 105700,
      "upper": 201775,
      "rate": 0.24
    },
    {
      "lower": 201775,
      "upper": 256225,
      "rate": 0.32
    },
    {
      "lower": 256225,
      "upper": 640600,
      "rate": 0.35
    },
    {
      "lower": 640600,
      "upper": 1000000000000,
      "rate": 0.37
    }
  ],
  "federalLtcgBrackets": [
    {
      "lower": 0,
      "upper": 49450,
      "rate": 0
    },
    {
      "lower": 49450,
      "upper": 545500,
      "rate": 0.15
    },
    {
      "lower": 545500,
      "upper": 1000000000000,
      "rate": 0.2
    }
  ],
  "nycBrackets": [
    {
      "lower": 0,
      "upper": 12000,
      "rate": 0.03078
    },
    {
      "lower": 12000,
      "upper": 25000,
      "rate": 0.03762
    },
    {
      "lower": 25000,
      "upper": 50000,
      "rate": 0.03819
    },
    {
      "lower": 50000,
      "upper": 1000000000000,
      "rate": 0.03876
    }
  ],
  "stateBrackets": {
    "AL": [
      {
        "lower": 0,
        "upper": 500,
        "rate": 0.02
      },
      {
        "lower": 500,
        "upper": 3000,
        "rate": 0.04
      },
      {
        "lower": 3000,
        "upper": 1000000000000,
        "rate": 0.05
      }
    ],
    "AK": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0
      }
    ],
    "AZ": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0.025
      }
    ],
    "AR": [
      {
        "lower": 0,
        "upper": 4500,
        "rate": 0.02
      },
      {
        "lower": 4500,
        "upper": 1000000000000,
        "rate": 0.039
      }
    ],
    "CA": [
      {
        "lower": 0,
        "upper": 10756,
        "rate": 0.01
      },
      {
        "lower": 10756,
        "upper": 25499,
        "rate": 0.02
      },
      {
        "lower": 25499,
        "upper": 40245,
        "rate": 0.04
      },
      {
        "lower": 40245,
        "upper": 55866,
        "rate": 0.06
      },
      {
        "lower": 55866,
        "upper": 70606,
        "rate": 0.08
      },
      {
        "lower": 70606,
        "upper": 360659,
        "rate": 0.093
      },
      {
        "lower": 360659,
        "upper": 432787,
        "rate": 0.103
      },
      {
        "lower": 432787,
        "upper": 721314,
        "rate": 0.113
      },
      {
        "lower": 721314,
        "upper": 1000000,
        "rate": 0.123
      },
      {
        "lower": 1000000,
        "upper": 1000000000000,
        "rate": 0.133
      }
    ],
    "CO": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0.044
      }
    ],
    "CT": [
      {
        "lower": 0,
        "upper": 10000,
        "rate": 0.02
      },
      {
        "lower": 10000,
        "upper": 50000,
        "rate": 0.045
      },
      {
        "lower": 50000,
        "upper": 100000,
        "rate": 0.055
      },
      {
        "lower": 100000,
        "upper": 200000,
        "rate": 0.06
      },
      {
        "lower": 200000,
        "upper": 250000,
        "rate": 0.065
      },
      {
        "lower": 250000,
        "upper": 500000,
        "rate": 0.069
      },
      {
        "lower": 500000,
        "upper": 1000000000000,
        "rate": 0.0699
      }
    ],
    "DE": [
      {
        "lower": 2000,
        "upper": 5000,
        "rate": 0.022
      },
      {
        "lower": 5000,
        "upper": 10000,
        "rate": 0.039
      },
      {
        "lower": 10000,
        "upper": 20000,
        "rate": 0.048
      },
      {
        "lower": 20000,
        "upper": 25000,
        "rate": 0.052
      },
      {
        "lower": 25000,
        "upper": 60000,
        "rate": 0.0555
      },
      {
        "lower": 60000,
        "upper": 1000000000000,
        "rate": 0.066
      }
    ],
    "FL": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0
      }
    ],
    "GA": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0.0539
      }
    ],
    "HI": [
      {
        "lower": 0,
        "upper": 9600,
        "rate": 0.014
      },
      {
        "lower": 9600,
        "upper": 14400,
        "rate": 0.032
      },
      {
        "lower": 14400,
        "upper": 19200,
        "rate": 0.055
      },
      {
        "lower": 19200,
        "upper": 24000,
        "rate": 0.064
      },
      {
        "lower": 24000,
        "upper": 36000,
        "rate": 0.068
      },
      {
        "lower": 36000,
        "upper": 48000,
        "rate": 0.072
      },
      {
        "lower": 48000,
        "upper": 125000,
        "rate": 0.076
      },
      {
        "lower": 125000,
        "upper": 175000,
        "rate": 0.079
      },
      {
        "lower": 175000,
        "upper": 225000,
        "rate": 0.0825
      },
      {
        "lower": 225000,
        "upper": 275000,
        "rate": 0.09
      },
      {
        "lower": 275000,
        "upper": 325000,
        "rate": 0.1
      },
      {
        "lower": 325000,
        "upper": 1000000000000,
        "rate": 0.11
      }
    ],
    "ID": [
      {
        "lower": 4673,
        "upper": 1000000000000,
        "rate": 0.05695
      }
    ],
    "IL": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0.0495
      }
    ],
    "IN": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0.03
      }
    ],
    "IA": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0.038
      }
    ],
    "KS": [
      {
        "lower": 0,
        "upper": 23000,
        "rate": 0.052
      },
      {
        "lower": 23000,
        "upper": 1000000000000,
        "rate": 0.0558
      }
    ],
    "KY": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0.04
      }
    ],
    "LA": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0.03
      }
    ],
    "ME": [
      {
        "lower": 0,
        "upper": 26800,
        "rate": 0.058
      },
      {
        "lower": 26800,
        "upper": 63450,
        "rate": 0.0675
      },
      {
        "lower": 63450,
        "upper": 1000000000000,
        "rate": 0.0715
      }
    ],
    "MD": [
      {
        "lower": 0,
        "upper": 1000,
        "rate": 0.02
      },
      {
        "lower": 1000,
        "upper": 2000,
        "rate": 0.03
      },
      {
        "lower": 2000,
        "upper": 3000,
        "rate": 0.04
      },
      {
        "lower": 3000,
        "upper": 100000,
        "rate": 0.0475
      },
      {
        "lower": 100000,
        "upper": 125000,
        "rate": 0.05
      },
      {
        "lower": 125000,
        "upper": 150000,
        "rate": 0.0525
      },
      {
        "lower": 150000,
        "upper": 250000,
        "rate": 0.055
      },
      {
        "lower": 250000,
        "upper": 1000000000000,
        "rate": 0.0575
      }
    ],
    "MA": [
      {
        "lower": 0,
        "upper": 1083150,
        "rate": 0.05
      },
      {
        "lower": 1083150,
        "upper": 1000000000000,
        "rate": 0.09
      }
    ],
    "MI": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0.0425
      }
    ],
    "MN": [
      {
        "lower": 0,
        "upper": 32570,
        "rate": 0.0535
      },
      {
        "lower": 32570,
        "upper": 106990,
        "rate": 0.068
      },
      {
        "lower": 106990,
        "upper": 198630,
        "rate": 0.0785
      },
      {
        "lower": 198630,
        "upper": 1000000000000,
        "rate": 0.0985
      }
    ],
    "MS": [
      {
        "lower": 10000,
        "upper": 1000000000000,
        "rate": 0.044
      }
    ],
    "MO": [
      {
        "lower": 1313,
        "upper": 2626,
        "rate": 0.02
      },
      {
        "lower": 2626,
        "upper": 3939,
        "rate": 0.025
      },
      {
        "lower": 3939,
        "upper": 5252,
        "rate": 0.03
      },
      {
        "lower": 5252,
        "upper": 6565,
        "rate": 0.035
      },
      {
        "lower": 6565,
        "upper": 7878,
        "rate": 0.04
      },
      {
        "lower": 7878,
        "upper": 9191,
        "rate": 0.045
      },
      {
        "lower": 9191,
        "upper": 1000000000000,
        "rate": 0.047
      }
    ],
    "MT": [
      {
        "lower": 0,
        "upper": 21100,
        "rate": 0.047
      },
      {
        "lower": 21100,
        "upper": 1000000000000,
        "rate": 0.059
      }
    ],
    "NE": [
      {
        "lower": 0,
        "upper": 4030,
        "rate": 0.0246
      },
      {
        "lower": 4030,
        "upper": 24120,
        "rate": 0.0351
      },
      {
        "lower": 24120,
        "upper": 38870,
        "rate": 0.0501
      },
      {
        "lower": 38870,
        "upper": 1000000000000,
        "rate": 0.052
      }
    ],
    "NV": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0
      }
    ],
    "NH": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0
      }
    ],
    "NJ": [
      {
        "lower": 0,
        "upper": 20000,
        "rate": 0.014
      },
      {
        "lower": 20000,
        "upper": 35000,
        "rate": 0.0175
      },
      {
        "lower": 35000,
        "upper": 40000,
        "rate": 0.035
      },
      {
        "lower": 40000,
        "upper": 75000,
        "rate": 0.05525
      },
      {
        "lower": 75000,
        "upper": 500000,
        "rate": 0.0637
      },
      {
        "lower": 500000,
        "upper": 1000000,
        "rate": 0.0897
      },
      {
        "lower": 1000000,
        "upper": 1000000000000,
        "rate": 0.1075
      }
    ],
    "NM": [
      {
        "lower": 0,
        "upper": 5500,
        "rate": 0.015
      },
      {
        "lower": 5500,
        "upper": 16500,
        "rate": 0.032
      },
      {
        "lower": 16500,
        "upper": 33500,
        "rate": 0.043
      },
      {
        "lower": 33500,
        "upper": 66500,
        "rate": 0.047
      },
      {
        "lower": 66500,
        "upper": 210000,
        "rate": 0.049
      },
      {
        "lower": 210000,
        "upper": 1000000000000,
        "rate": 0.059
      }
    ],
    "NY": [
      {
        "lower": 0,
        "upper": 8500,
        "rate": 0.04
      },
      {
        "lower": 8500,
        "upper": 11700,
        "rate": 0.045
      },
      {
        "lower": 11700,
        "upper": 13900,
        "rate": 0.0525
      },
      {
        "lower": 13900,
        "upper": 80650,
        "rate": 0.055
      },
      {
        "lower": 80650,
        "upper": 215400,
        "rate": 0.06
      },
      {
        "lower": 215400,
        "upper": 1077550,
        "rate": 0.0685
      },
      {
        "lower": 1077550,
        "upper": 5000000,
        "rate": 0.0965
      },
      {
        "lower": 5000000,
        "upper": 25000000,
        "rate": 0.103
      },
      {
        "lower": 25000000,
        "upper": 1000000000000,
        "rate": 0.109
      }
    ],
    "NC": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0.0425
      }
    ],
    "ND": [
      {
        "lower": 48475,
        "upper": 244825,
        "rate": 0.0195
      },
      {
        "lower": 244825,
        "upper": 1000000000000,
        "rate": 0.025
      }
    ],
    "OH": [
      {
        "lower": 26050,
        "upper": 100000,
        "rate": 0.0275
      },
      {
        "lower": 100000,
        "upper": 1000000000000,
        "rate": 0.035
      }
    ],
    "OK": [
      {
        "lower": 0,
        "upper": 1000,
        "rate": 0.0025
      },
      {
        "lower": 1000,
        "upper": 2500,
        "rate": 0.0075
      },
      {
        "lower": 2500,
        "upper": 3750,
        "rate": 0.0175
      },
      {
        "lower": 3750,
        "upper": 4900,
        "rate": 0.0275
      },
      {
        "lower": 4900,
        "upper": 7200,
        "rate": 0.0375
      },
      {
        "lower": 7200,
        "upper": 1000000000000,
        "rate": 0.0475
      }
    ],
    "OR": [
      {
        "lower": 0,
        "upper": 4400,
        "rate": 0.0475
      },
      {
        "lower": 4400,
        "upper": 11050,
        "rate": 0.0675
      },
      {
        "lower": 11050,
        "upper": 125000,
        "rate": 0.0875
      },
      {
        "lower": 125000,
        "upper": 1000000000000,
        "rate": 0.099
      }
    ],
    "PA": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0.0307
      }
    ],
    "RI": [
      {
        "lower": 0,
        "upper": 79900,
        "rate": 0.0375
      },
      {
        "lower": 79900,
        "upper": 181650,
        "rate": 0.0475
      },
      {
        "lower": 181650,
        "upper": 1000000000000,
        "rate": 0.0599
      }
    ],
    "SC": [
      {
        "lower": 0,
        "upper": 3560,
        "rate": 0
      },
      {
        "lower": 3560,
        "upper": 17830,
        "rate": 0.03
      },
      {
        "lower": 17830,
        "upper": 1000000000000,
        "rate": 0.062
      }
    ],
    "SD": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0
      }
    ],
    "TN": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0
      }
    ],
    "TX": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0
      }
    ],
    "UT": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0.0455
      }
    ],
    "VT": [
      {
        "lower": 0,
        "upper": 47900,
        "rate": 0.0335
      },
      {
        "lower": 47900,
        "upper": 116000,
        "rate": 0.066
      },
      {
        "lower": 116000,
        "upper": 242000,
        "rate": 0.076
      },
      {
        "lower": 242000,
        "upper": 1000000000000,
        "rate": 0.0875
      }
    ],
    "VA": [
      {
        "lower": 0,
        "upper": 3000,
        "rate": 0.02
      },
      {
        "lower": 3000,
        "upper": 5000,
        "rate": 0.03
      },
      {
        "lower": 5000,
        "upper": 17000,
        "rate": 0.05
      },
      {
        "lower": 17000,
        "upper": 1000000000000,
        "rate": 0.0575
      }
    ],
    "WA": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0
      }
    ],
    "WV": [
      {
        "lower": 0,
        "upper": 10000,
        "rate": 0.0222
      },
      {
        "lower": 10000,
        "upper": 25000,
        "rate": 0.0296
      },
      {
        "lower": 25000,
        "upper": 40000,
        "rate": 0.0333
      },
      {
        "lower": 40000,
        "upper": 60000,
        "rate": 0.0444
      },
      {
        "lower": 60000,
        "upper": 1000000000000,
        "rate": 0.0482
      }
    ],
    "WI": [
      {
        "lower": 0,
        "upper": 14680,
        "rate": 0.035
      },
      {
        "lower": 14680,
        "upper": 29370,
        "rate": 0.044
      },
      {
        "lower": 29370,
        "upper": 323290,
        "rate": 0.053
      },
      {
        "lower": 323290,
        "upper": 1000000000000,
        "rate": 0.0765
      }
    ],
    "WY": [
      {
        "lower": 0,
        "upper": 1000000000000,
        "rate": 0
      }
    ],
    "DC": [
      {
        "lower": 0,
        "upper": 10000,
        "rate": 0.04
      },
      {
        "lower": 10000,
        "upper": 40000,
        "rate": 0.06
      },
      {
        "lower": 40000,
        "upper": 60000,
        "rate": 0.065
      },
      {
        "lower": 60000,
        "upper": 250000,
        "rate": 0.085
      },
      {
        "lower": 250000,
        "upper": 500000,
        "rate": 0.0925
      },
      {
        "lower": 500000,
        "upper": 1000000,
        "rate": 0.0975
      },
      {
        "lower": 1000000,
        "upper": 1000000000000,
        "rate": 0.1075
      }
    ]
  },
  "rmdDivisors": {
    "72": 27.4,
    "73": 26.5,
    "74": 25.5,
    "75": 24.6,
    "76": 23.7,
    "77": 22.9,
    "78": 22,
    "79": 21.1,
    "80": 20.2,
    "81": 19.4,
    "82": 18.5,
    "83": 17.7,
    "84": 16.8,
    "85": 16,
    "86": 15.2,
    "87": 14.4,
    "88": 13.7,
    "89": 12.9,
    "90": 12.2,
    "91": 11.5,
    "92": 10.8,
    "93": 10.1,
    "94": 9.5,
    "95": 8.9,
    "96": 8.4,
    "97": 7.8,
    "98": 7.3,
    "99": 6.8,
    "100": 6.4,
    "101": 6,
    "102": 5.6,
    "103": 5.2,
    "104": 4.9,
    "105": 4.6,
    "106": 4.3,
    "107": 4.1,
    "108": 3.9,
    "109": 3.7,
    "110": 3.5,
    "111": 3.4,
    "112": 3.3,
    "113": 3.1,
    "114": 3,
    "115": 2.9,
    "116": 2.8,
    "117": 2.7,
    "118": 2.5,
    "119": 2.3,
    "120": 2
  }
};
