<script setup>
import { brand } from '../config/brand'
defineProps({ iconOnly: Boolean })
</script>
<template>
  <span class="brand-lockup"><svg viewBox="0 0 72 64" fill="currentColor" aria-hidden="true"><path d="M7 17H21L33 42L45 17H59L39 58H25Z M49 7H64L60 15H45Z"/></svg><span v-if="!iconOnly">{{ brand.name.toLowerCase() }}<span class="brand-dot">.</span></span></span>
</template>
