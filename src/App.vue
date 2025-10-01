<template>
  <div class="min-h-svh bg-background">
    <!-- Header -->
    <header class="border-b bg-background/90 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2 cursor-default select-none">
            <img src="/icon.svg" width="24" height="24" alt="pdf tools logo" />
            <h1 class="text-2xl font-medium font-main">PdfRizz</h1>
          </div>

          <!-- Navigation -->
          <nav class="flex items-center gap-2 md:gap-4">
            <router-link
              to="/"
              class="md:px-4 px-2 py-2 rounded-lg text-sm font-medium transition-colors hover:text-primary"
              :class="$route.name === 'Home' ? 'text-primary' : ''">
              <Icon icon="lucide:file-text" class="h-4 w-4 inline mr-2" />
              PDF Tools
            </router-link>
            <router-link
              to="/compress"
              class="md:px-4 px-2 py-2 rounded-lg text-sm font-medium transition-colors hover:text-primary"
              :class="$route.name === 'Compress' ? 'text-primary' : ''">
              <Icon icon="lucide:zap" class="h-4 w-4 inline mr-2" />
              Compress
            </router-link>
          </nav>

          <div class="flex items-center space-x-4">
            <div class="flex gap-2 items-center">
              <a
                v-if="repoStarsCount"
                title="Star this project on GitHub"
                href="https://github.com/najmiter/pdf"
                target="_blank">
                <Button variant="soft" size="sm" class="h-9">
                  <span class="sr-only">Stars</span>
                  <span class="text-xs">{{ repoStarsCount }}</span>
                  <Icon icon="lucide:github" class="h-4 w-4" />
                  <span class="sr-only">Github</span>
                </Button>
              </a>
              <Button variant="soft" size="icon" @click="toggleDarkMode" class="w-9 h-9">
                <Icon :icon="isDark ? 'lucide:sun' : 'lucide:moon'" class="h-4 w-4" />
                <span class="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="h-[calc(100vh-73px)]">
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
