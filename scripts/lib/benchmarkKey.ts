// Keeps benchmark runs off the production Gemini quota.
//
// The free Gemini tier allows ~20 requests per day per key, and the benchmark
// and review scripts make dozens of calls. Run them with a separate key:
//   BENCHMARK_GEMINI_API_KEY=... in .env   (a second free key from another Google project)
// or pass --use-main-key to spend the main key's quota deliberately.
//
// Returns process.argv[2...] with the flag removed.
export function useBenchmarkGeminiKey(): string[] {
  const args = process.argv.slice(2).filter(a => a !== "--use-main-key");
  const useMain = process.argv.includes("--use-main-key");
  const benchKey = process.env.BENCHMARK_GEMINI_API_KEY;

  if (benchKey) {
    // The provider reads GEMINI_API_KEY when each request is made, so this
    // redirects every Gemini call in this process to the benchmark key.
    process.env.GEMINI_API_KEY = benchKey;
  } else if (!useMain) {
    console.error(
      "\nRefusing to run: no BENCHMARK_GEMINI_API_KEY set.\n" +
      "This script makes dozens of AI calls, and the main Gemini key's free tier (~20/day)\n" +
      "is shared with the live chat. Add BENCHMARK_GEMINI_API_KEY to .env (a second free key),\n" +
      "or pass --use-main-key to use the main key's quota anyway.\n"
    );
    process.exit(1);
  }
  return args;
}
