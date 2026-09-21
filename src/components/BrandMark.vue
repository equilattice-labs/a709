<script setup>
import { brand } from "../config/brand";
defineProps({ iconOnly: Boolean });
</script>
<template>
  <span class="brand-lockup"
    ><svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M6 12H42M6 24H42M6 36H42"
        stroke="currentColor"
        stroke-width="3"
      />
      <path
        d="M12 7H22V17H12ZM26 19H36V29H26ZM17 31H27V41H17Z"
        fill="currentColor"
      /></svg
    ><span v-if="!iconOnly">{{ brand.name.toLowerCase() }}</span></span
  >
</template>
