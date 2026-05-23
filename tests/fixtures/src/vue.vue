<!-- Vue fixture -->
<!-- Detected icons: add-outline (static), star (static), home (via :name) -->
<template>
  <div>
    <!-- Static attribute -->
    <ion-icon name="add-outline" />

    <!-- Another static attribute -->
    <ion-icon name="star" />

    <!-- Dynamic binding with string literal -->
    <ion-icon :name="'home'" />

    <!-- Dynamic variable — should NOT be detected -->
    <ion-icon :name="dynamicIcon" />
  </div>
</template>

<script setup lang="ts">
const dynamicIcon = 'some-runtime-icon';
</script>
