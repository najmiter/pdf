<template>
  <div class="min-h-svh bg-background">
    <!-- Header -->
    <header
      class="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div class="container mx-auto px-4">
        <div class="flex h-14 items-center justify-between gap-4">
          <router-link to="/" class="group flex items-center gap-2.5 select-none">
            <div
              class="grid h-8 w-8 place-content-center rounded-lg bg-primary/15 ring-1 ring-primary/25 transition-transform duration-300 group-hover:scale-105">
              <img src="/icon.svg" width="18" height="18" alt="pdf tools logo" />
            </div>
            <h1 class="text-lg font-semibold tracking-tight">Pdf<span class="text-primary">Rizz</span></h1>
          </router-link>

          <!-- Navigation -->
          <nav class="flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 p-1 text-sm font-medium">
            <router-link
              to="/"
              class="rounded-full px-4 py-1.5 transition-all duration-200"
              :class="
                $route.name === 'Home'
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              ">
              Home
            </router-link>
            <router-link
              to="/compress"
              class="rounded-full px-4 py-1.5 transition-all duration-200"
              :class="
                $route.name === 'Compress'
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              ">
              Compress
            </router-link>
          </nav>

          <div class="flex items-center gap-2">
            <a
              v-if="repoStarsCount"
              class="hidden sm:inline-block"
              title="Star this project on GitHub"
              href="https://github.com/najmiter/pdf"
              target="_blank">
              <Button variant="ghost" size="sm" class="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
                <Icon icon="lucide:github" class="h-4 w-4" />
                <span class="text-xs font-semibold tabular-nums">{{ repoStarsCount }}</span>
                <span class="sr-only">stars on Github</span>
              </Button>
            </a>
            <Button
              variant="ghost"
              size="icon"
              @click="toggleDarkMode"
              class="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Icon :icon="isDark ? 'lucide:sun' : 'lucide:moon'" class="h-4 w-4" />
              <span class="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>
    </header>

    <div class="h-[calc(100svh-57px)] pt-4">
      <!-- Router View -->
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Icon } from '@iconify/vue';
import { useDarkMode } from '@/composables/useDarkMode';
import Button from '@/components/ui/Button.vue';

const { isDark, toggleDarkMode } = useDarkMode();
const repoStarsCount = ref<string | null>(null);

onMounted(async () => {
  try {
    const response = await fetch('https://api.github.com/repos/najmiter/pdf');
    const data = await response.json();
    repoStarsCount.value = Intl.NumberFormat('en-us', { notation: 'compact' }).format(data.stargazers_count);
  } catch {}
});
</script>
