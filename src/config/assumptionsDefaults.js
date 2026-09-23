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
    "ss_wage_base": 184500,
    "medicare_rate": 0.0145,
    "addl_medicare_rate": 0.009,
    "addl_medicare_threshold": 200000,
    "std_deduction_single": 16100,
    "limit_401k": 24500,
    "limit_ira": 7500,
    "rmd_start_age": 75,
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
        "upper": 4600,
        "rate": 0.02
      },
      {
        "lower": 4600,
        "upper": 1000000000000,
        "rate": 0.039
      }
    ],
    "CA": [
      {
        "lower": 0,
        "upper": 11079,
        "rate": 0.01
      },
      {
        "lower": 11079,
        "upper": 26264,
        "rate": 0.02
      },
      {
        "lower": 26264,
        "upper": 41452,
        "rate": 0.04
      },
      {
        "lower": 41452,
        "upper": 57542,
        "rate": 0.06
      },
      {
        "lower": 57542,
        "upper": 72724,
        "rate": 0.08
      },
      {
        "lower": 72724,
        "upper": 371479,
        "rate": 0.093
      },
      {
        "lower": 371479,
        "upper": 445771,
        "rate": 0.103
      },
      {
        "lower": 445771,
        "upper": 742953,
        "rate": 0.113
      },
      {
        "lower": 742953,
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
        "rate": 0.0499
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
        "lower": 4811,
        "upper": 1000000000000,
        "rate": 0.053
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
        "rate": 0.0295
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
        "rate": 0.035
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
        "upper": 27399,
        "rate": 0.058
      },
      {
        "lower": 27399,
        "upper": 64849,
        "rate": 0.0675
      },
      {
        "lower": 64849,
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
        "upper": 500000,
        "rate": 0.0575
      },
      {
        "lower": 500000,
        "upper": 1000000,
        "rate": 0.0625
      },
      {
        "lower": 1000000,
        "upper": 1000000000000,
        "rate": 0.065
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
        "upper": 33310,
        "rate": 0.0535
      },
      {
        "lower": 33310,
        "upper": 109430,
        "rate": 0.068
      },
      {
        "lower": 109430,
        "upper": 203150,
        "rate": 0.0785
      },
      {
        "lower": 203150,
        "upper": 1000000000000,
        "rate": 0.0985
      }
    ],
    "MS": [
      {
        "lower": 10000,
        "upper": 1000000000000,
        "rate": 0.04
      }
    ],
    "MO": [
      {
        "lower": 1348,
        "upper": 2696,
        "rate": 0.02
      },
      {
        "lower": 2696,
        "upper": 4044,
        "rate": 0.025
      },
      {
        "lower": 4044,
        "upper": 5392,
        "rate": 0.03
      },
      {
        "lower": 5392,
        "upper": 6740,
        "rate": 0.035
      },
      {
        "lower": 6740,
        "upper": 8088,
        "rate": 0.04
      },
      {
        "lower": 8088,
        "upper": 9436,
        "rate": 0.045
      },
      {
        "lower": 9436,
        "upper": 1000000000000,
        "rate": 0.047
      }
    ],
    "MT": [
      {
        "lower": 0,
        "upper": 47500,
        "rate": 0.047
      },
      {
        "lower": 47500,
        "upper": 1000000000000,
        "rate": 0.0565
      }
    ],
    "NE": [
      {
        "lower": 0,
        "upper": 4130,
        "rate": 0.0246
      },
      {
        "lower": 4130,
        "upper": 24760,
        "rate": 0.0351
      },
      {
        "lower": 24760,
        "upper": 1000000000000,
        "rate": 0.0455
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
        "rate": 0.039
      },
      {
        "lower": 8500,
        "upper": 11700,
        "rate": 0.044
      },
      {
        "lower": 11700,
        "upper": 13900,
        "rate": 0.0515
      },
      {
        "lower": 13900,
        "upper": 80650,
        "rate": 0.054
      },
      {
        "lower": 80650,
        "upper": 215400,
        "rate": 0.059
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
        "rate": 0.0399
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
        "upper": 1000000000000,
        "rate": 0.0275
      }
    ],
    "OK": [
      {
        "lower": 3750,
        "upper": 4900,
        "rate": 0.025
      },
      {
        "lower": 4900,
        "upper": 7200,
        "rate": 0.035
      },
      {
        "lower": 7200,
        "upper": 1000000000000,
        "rate": 0.045
      }
    ],
    "OR": [
      {
        "lower": 0,
        "upper": 4550,
        "rate": 0.0475
      },
      {
        "lower": 4550,
        "upper": 11400,
        "rate": 0.0675
      },
      {
        "lower": 11400,
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
        "upper": 82050,
        "rate": 0.0375
      },
      {
        "lower": 82050,
        "upper": 186450,
        "rate": 0.0475
      },
      {
        "lower": 186450,
        "upper": 1000000000000,
        "rate": 0.0599
      }
    ],
    "SC": [
      {
        "lower": 0,
        "upper": 30000,
        "rate": 0.0199
      },
      {
        "lower": 30000,
        "upper": 1000000000000,
        "rate": 0.0521
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
        "rate": 0.0445
      }
    ],
    "VT": [
      {
        "lower": 0,
        "upper": 49400,
        "rate": 0.0335
      },
      {
        "lower": 49400,
        "upper": 119700,
        "rate": 0.066
      },
      {
        "lower": 119700,
        "upper": 249700,
        "rate": 0.076
      },
      {
        "lower": 249700,
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
        "upper": 15110,
        "rate": 0.035
      },
      {
        "lower": 15110,
        "upper": 51950,
        "rate": 0.044
      },
      {
        "lower": 51950,
        "upper": 332720,
        "rate": 0.053
      },
      {
        "lower": 332720,
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
  },
  "stateDeductions": {
    "AL": {
      "std": 3000,
      "personal": 1500
    },
    "AK": {
      "std": 0,
      "personal": 0
    },
    "AZ": {
      "std": 8350,
      "personal": 0
    },
    "AR": {
      "std": 2470,
      "personal": 0
    },
    "CA": {
      "std": 5540,
      "personal": 0
    },
    "CO": {
      "std": "federal",
      "personal": 0
    },
    "CT": {
      "std": 0,
      "personal": 15000
    },
    "DE": {
      "std": 3250,
      "personal": 0
    },
    "FL": {
      "std": 0,
      "personal": 0
    },
    "GA": {
      "std": 12000,
      "personal": 0
    },
    "HI": {
      "std": 4400,
      "personal": 1144
    },
    "ID": {
      "std": "federal",
      "personal": 0
    },
    "IL": {
      "std": 0,
      "personal": 2925
    },
    "IN": {
      "std": 0,
      "personal": 1000
    },
    "IA": {
      "std": "federal",
      "personal": 0
    },
    "KS": {
      "std": 3605,
      "personal": 9160
    },
    "KY": {
      "std": 3360,
      "personal": 0
    },
    "LA": {
      "std": 12875,
      "personal": 0
    },
    "ME": {
      "std": 8350,
      "personal": 5300
    },
    "MD": {
      "std": 3350,
      "personal": 3200
    },
    "MA": {
      "std": 0,
      "personal": 4400
    },
    "MI": {
      "std": 0,
      "personal": 5900
    },
    "MN": {
      "std": 15300,
      "personal": 0
    },
    "MS": {
      "std": 2300,
      "personal": 6000
    },
    "MO": {
      "std": "federal",
      "personal": 0
    },
    "MT": {
      "std": "federal",
      "personal": 0
    },
    "NE": {
      "std": 8850,
      "personal": 0
    },
    "NV": {
      "std": 0,
      "personal": 0
    },
    "NH": {
      "std": 0,
      "personal": 0
    },
    "NJ": {
      "std": 0,
      "personal": 1000
    },
    "NM": {
      "std": "federal",
      "personal": 0
    },
    "NY": {
      "std": 8000,
      "personal": 0
    },
    "NC": {
      "std": 12750,
      "personal": 0
    },
    "ND": {
      "std": "federal",
      "personal": 0
    },
    "OH": {
      "std": 0,
      "personal": 2400
    },
    "OK": {
      "std": 6350,
      "personal": 1000
    },
    "OR": {
      "std": 2910,
      "personal": 0
    },
    "PA": {
      "std": 0,
      "personal": 0
    },
    "RI": {
      "std": 11200,
      "personal": 5250
    },
    "SC": {
      "std": 8350,
      "personal": 0
    },
    "SD": {
      "std": 0,
      "personal": 0
    },
    "TN": {
      "std": 0,
      "personal": 0
    },
    "TX": {
      "std": 0,
      "personal": 0
    },
    "UT": {
      "std": 0,
      "personal": 0
    },
    "VT": {
      "std": 7650,
      "personal": 5300
    },
    "VA": {
      "std": 8750,
      "personal": 930
    },
    "WA": {
      "std": 0,
      "personal": 0
    },
    "WV": {
      "std": 0,
      "personal": 2000
    },
    "WI": {
      "std": 13960,
      "personal": 700
    },
    "WY": {
      "std": 0,
      "personal": 0
    },
    "DC": {
      "std": "federal",
      "personal": 0
    }
  }
};
