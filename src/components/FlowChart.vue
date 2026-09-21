<script setup>
defineProps({ mode: { type: String, default: "vesting" }, compact: Boolean });
</script>
<template>
  <svg
    class="flow-chart"
    viewBox="0 0 440 190"
    role="img"
    :aria-label="`${mode} release schedule illustration`"
  >
    <defs>
      <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="#355dff" stop-opacity=".32" />
        <stop offset="1" stop-color="#355dff" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path
      v-for="y in [25, 70, 115, 160]"
      :key="y"
      :d="`M20 ${y}H425`"
      stroke="currentColor"
      opacity=".09"
      stroke-dasharray="3 5"
    />
    <template v-if="mode === 'lock'">
      <path d="M20 160H340V25H425V160Z" fill="url(#chartFill)" />
      <path
        d="M20 160H340V25H425"
        stroke="#355dff"
        fill="none"
        stroke-width="3"
      />
      <circle cx="340" cy="25" r="5" fill="#355dff" />
    </template>
    <template v-else-if="mode === 'stream'">
      <path d="M20 160 425 25V160Z" fill="url(#chartFill)" />
      <path d="M20 160 425 25" stroke="#355dff" fill="none" stroke-width="3" />
      <circle cx="262" cy="79" r="6" fill="#355dff" />
    </template>
    <template v-else>
      <path
        d="M20 160H120V125H180V100H240V75H300V50H360V25H425V160Z"
        fill="url(#chartFill)"
      />
      <path
        d="M20 160H120V125H180V100H240V75H300V50H360V25H425"
        stroke="#355dff"
        stroke-width="3"
        fill="none"
      />
      <circle cx="240" cy="75" r="5" fill="#355dff" />
      <path
        d="M120 10V164"
        stroke="currentColor"
        opacity=".22"
        stroke-dasharray="4 5"
      />
    </template>
    <g fill="currentColor" opacity=".8" font-size="10" font-family="monospace">
      <text x="20" y="185">START</text>
      <text v-if="mode === 'vesting' || mode === 'airdrop'" x="105" y="185">
        CLIFF
      </text>
      <text x="399" y="185">END</text>
    </g>
  </svg>
</template>
