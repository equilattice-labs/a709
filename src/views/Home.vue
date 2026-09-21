<script setup>
import { ref, computed } from "vue";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Check,
  Timer,
  LockKeyhole,
  Waves,
  Layers3,
  ShieldCheck,
  MoveRight,
} from "lucide-vue-next";
import LiveStats from "../components/LiveStats.vue";
const activeMode = ref("vesting"),
  position = ref(60);
const products = [
  {
    id: "vesting",
    name: "Token vesting",
    short: "Vesting",
    icon: Timer,
    tag: "TEAMS & CONTRIBUTORS",
    description:
      "Align a team around a shared timeline. Set a cliff and release tokens in measured steps.",
    label: "A shared horizon",
    color: "blue",
  },
  {
    id: "lock",
    name: "Token locks",
    short: "Lock",
    icon: LockKeyhole,
    tag: "TREASURIES & RESERVES",
    description:
      "One amount. One date. Keep tokens in escrow until a precise moment in the future.",
    label: "A date you can count on",
    color: "orange",
  },
  {
    id: "stream",
    name: "Payment streams",
    short: "Stream",
    icon: Waves,
    tag: "PAYROLL & GRANTS",
    description:
      "Let a funded balance unlock by the second. Recipients claim when they are ready.",
    label: "A continuous release",
    color: "violet",
  },
  {
    id: "airdrop",
    name: "Vested batches",
    short: "Batch",
    icon: Layers3,
    tag: "COMMUNITIES & ECOSYSTEMS",
    description:
      "Up to 100 recipients. Individual allocations. One shared schedule, funded in one batch.",
    label: "One timeline. Many people.",
    color: "mint",
  },
];
const active = computed(() => products.find((p) => p.id === activeMode.value));
function releaseAt(p) {
  return activeMode.value === "lock"
    ? p >= 80
      ? 100
      : 0
    : activeMode.value === "stream"
      ? p
      : p < 20
        ? 0
        : Math.min(100, 20 + Math.floor((p - 20) / 10) * 10);
}
const released = computed(() => releaseAt(Number(position.value)));
const chartPoints = computed(() =>
  Array.from(
    { length: 101 },
    (_, i) => `${32 + i * 4.1},${194 - releaseAt(i) * 1.45}`,
  ).join(" "),
);
function tabKey(e) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
  e.preventDefault();
  const i = products.findIndex((p) => p.id === activeMode.value);
  const next =
    e.key === "Home"
      ? 0
      : e.key === "End"
        ? 3
        : (i + (e.key === "ArrowRight" ? 1 : -1) + 4) % 4;
  activeMode.value = products[next].id;
  document.getElementById(`demo-tab-${activeMode.value}`)?.focus();
}
const faqs = [
  [
    "What happens after I fund a schedule?",
    "The contract holds the tokens under the terms you approve. Recipients claim the unlocked balance. Streams accrue value; they do not automatically push payments to a wallet.",
  ],
  [
    "Can the terms change?",
    "Amounts and dates cannot be edited after funding. When cancellation is enabled, the creator can recover the unvested remainder. Vested tokens remain available to the recipient. Recipients may transfer their remaining claim rights.",
  ],
  [
    "What does it cost?",
    "There are no protocol fees on this testnet deployment. Approvals, funding and claims require testnet ETH for network gas. The demonstration token has no monetary value.",
  ],
  [
    "Can I use real funds?",
    "This is an unaudited testnet pilot. Use test tokens only. Production use requires independent security review and operational readiness.",
  ],
];
</script>
<template>
  <div class="overview-page container">
    <section class="overview-hero">
      <div class="hero-copy">
        <p class="eyebrow">
          <span class="tiny-square" /> TOKEN DISTRIBUTION, COMPOSED.
        </p>
        <h1>Make time<br />part of<br /><span>the plan.</span></h1>
        <p class="hero-description">
          A clearer way to move tokens.<br />Set the people, the pace, and the
          terms.<br />Let the schedule take it from there.
        </p>
        <div class="hero-buttons">
          <RouterLink to="/create" class="button button-primary"
            >Create a schedule <ArrowUpRight :size="18" /></RouterLink
          ><a href="#products" class="text-button"
            >Explore the tools <ArrowRight :size="16"
          /></a>
        </div>
        <div class="hero-footnote">
          <ShieldCheck :size="15" /><span
            >Onchain rules. Visible from day one.</span
          >
        </div>
      </div>
      <div class="timeline-studio">
        <div class="studio-heading">
          <span><span class="status-dot" /> THE SCHEDULE STUDIO</span
          ><span class="example-tag">INTERACTIVE EXAMPLE</span>
        </div>
        <div class="studio-title">
          <div>
            <p>{{ active.label }}</p>
            <h2>10,000 <span>tokens</span></h2>
          </div>
          <div class="studio-icon">
            <component :is="active.icon" :size="24" />
          </div>
        </div>
        <div
          class="studio-tabs"
          role="tablist"
          aria-label="Explore schedule modes"
          @keydown="tabKey"
        >
          <button
            v-for="product in products"
            :key="product.id"
            :id="`demo-tab-${product.id}`"
            role="tab"
            :aria-selected="activeMode === product.id"
            :tabindex="activeMode === product.id ? 0 : -1"
            aria-controls="studio-panel"
            :class="{ active: activeMode === product.id }"
            @click="activeMode = product.id"
          >
            {{ product.short }}
          </button>
        </div>
        <div
          id="studio-panel"
          role="tabpanel"
          :aria-labelledby="`demo-tab-${activeMode}`"
        >
          <div class="studio-chart">
            <div class="chart-topline">
              <span>UNLOCKED BALANCE</span><strong>{{ released }}%</strong>
            </div>
            <svg
              viewBox="0 0 468 235"
              role="img"
              :aria-label="`${active.name} example: ${released}% unlocked at ${position}% of the timeline`"
            >
              <path
                v-for="y in [49, 97, 145, 194]"
                :key="y"
                :d="`M32 ${y}H442`"
                stroke="#dbe1eb"
                stroke-dasharray="3 4"
              />
              <path
                :d="`M32 194 L${chartPoints.replaceAll(' ', ' L')} L442 194 Z`"
                fill="#e9eeff"
              />
              <polyline
                :points="chartPoints"
                fill="none"
                stroke="#355dff"
                stroke-width="3"
                stroke-linejoin="round"
              />
              <line
                :x1="32 + Number(position) * 4.1"
                :x2="32 + Number(position) * 4.1"
                y1="28"
                y2="194"
                stroke="#18202c"
                stroke-dasharray="3 5"
              />
              <circle
                :cx="32 + Number(position) * 4.1"
                :cy="194 - released * 1.45"
                r="6"
                fill="#355dff"
                stroke="white"
                stroke-width="3"
              />
              <g fill="#697486" font-size="10" font-family="monospace">
                <text x="32" y="220">START</text>
                <text x="218" y="220">TIMELINE</text>
                <text x="422" y="220">END</text>
              </g>
            </svg>
          </div>
          <label class="demo-slider-label" for="demo-time"
            ><span>Move through time <MoveRight :size="13" /></span
            ><strong
              >{{ (released * 100).toLocaleString() }} tokens unlocked</strong
            ></label
          ><input
            id="demo-time"
            v-model="position"
            type="range"
            min="0"
            max="100"
            :aria-valuetext="`${position}% of timeline, ${released * 100} tokens unlocked`"
          />
          <div class="studio-bottom">
            <span>Illustrative terms · no wallet needed</span
            ><RouterLink :to="`/create?mode=${activeMode}`"
              >Use this mode <ArrowUpRight :size="15"
            /></RouterLink>
          </div>
        </div>
      </div>
    </section>
    <section id="products" class="tools-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">01 / CHOOSE YOUR FORMAT</p>
          <h2>Four tools. Your timeline.</h2>
        </div>
        <span class="section-side-note"
          >Built for different kinds of commitment.</span
        >
      </div>
      <div class="tool-grid">
        <RouterLink
          v-for="(product, i) in products"
          :key="product.id"
          :to="`/create?mode=${product.id}`"
          class="tool-card"
          :class="product.color"
          ><div class="tool-top">
            <span class="tool-icon"
              ><component :is="product.icon" :size="21" /></span
            ><span class="tool-number">0{{ i + 1 }}</span>
          </div>
          <h3>{{ product.name }} <ArrowUpRight :size="17" /></h3>
          <p>{{ product.description }}</p>
          <span class="tool-tag">{{ product.tag }}</span></RouterLink
        >
      </div>
    </section>
    <LiveStats />
    <section id="how-it-works" class="journey-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">02 / FROM INTENT TO EXECUTION</p>
          <h2>Set it up. See it through.</h2>
        </div>
        <RouterLink class="text-button" to="/docs#getting-started"
          >The complete guide <ArrowUpRight :size="16"
        /></RouterLink>
      </div>
      <div class="journey-grid">
        <article>
          <span class="journey-number">01</span>
          <h3>Compose</h3>
          <p>
            Choose your token, recipients and release dates. Preview the exact
            schedule before you commit.
          </p>
        </article>
        <article>
          <span class="journey-number">02</span>
          <h3>Fund</h3>
          <p>
            Connect your wallet, approve the required allowance, then fund your
            schedule with test tokens.
          </p>
        </article>
        <article>
          <span class="journey-number">03</span>
          <h3>Follow</h3>
          <p>
            Track progress in your workspace. Share a public schedule link.
            Claim tokens as they unlock.
          </p>
        </article>
      </div>
    </section>
    <section class="rules-banner">
      <div class="rules-art" aria-hidden="true">
        <span /><span /><span /><i /><i /><i />
      </div>
      <div class="rules-copy">
        <p class="eyebrow">THE TERMS STAY IN VIEW</p>
        <h2>A timeline you can inspect.</h2>
        <p>
          No administrator withdrawal. No upgrade switch. The deployed contract
          defines the rules, and every schedule can be read onchain.
        </p>
        <div class="rules-checks">
          <span><Check :size="15" /> Exact token accounting</span
          ><span><Check :size="15" /> Public schedule details</span>
        </div>
        <RouterLink to="/docs#security" class="text-button"
          >Read the rules & limits <ArrowUpRight :size="16"
        /></RouterLink>
      </div>
    </section>
    <section id="faq" class="questions-section">
      <div>
        <p class="eyebrow">03 / BEFORE YOU BEGIN</p>
        <h2>A few things<br />to know.</h2>
        <p>Clear expectations.<br />From the first transaction.</p>
      </div>
      <div class="faq-list">
        <details v-for="([q, a], i) in faqs" :key="q">
          <summary>
            <span class="faq-number">0{{ i + 1 }}</span
            >{{ q }}<Plus :size="18" />
          </summary>
          <p>{{ a }}</p>
        </details>
      </div>
    </section>
    <section class="start-banner">
      <div>
        <span class="eyebrow">YOUR NEXT MOVE</span>
        <h2>Put the plan in motion.</h2>
        <p>Testnet only. Use test tokens. Independent audit pending.</p>
      </div>
      <RouterLink to="/create" class="button button-primary"
        >Create a schedule <ArrowUpRight :size="18"
      /></RouterLink>
    </section>
  </div>
</template>
