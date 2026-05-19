import { ref, watch, onMounted } from 'vue';

export function useDarkMode() {
  const isDark = ref(false);

  const toggleDarkMode = () => {
    isDark.value = !isDark.value;
  };

  const setDarkMode = (value: boolean) => {
    isDark.value = value;
  };

  // Watch for changes and update the DOM
  watch(isDark, (newValue) => {
    if (newValue) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  });

  // Initialize on mount
  onMounted(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
    } else {
      setDarkMode(false);
    }
  });

  return {
    isDark,
    toggleDarkMode,
    setDarkMode,
  };
}
