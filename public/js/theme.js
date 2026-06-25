// MotoCRM Finexy Theme Controller
(function() {
  const html = document.documentElement;
  const storedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const activeTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
  
  if (activeTheme === 'dark') {
    html.classList.add('dark');
    html.classList.remove('light');
  } else {
    html.classList.add('light');
    html.classList.remove('dark');
  }
  
  html.classList.add('theme-loaded');
  
  document.addEventListener('DOMContentLoaded', () => {
    
    const updateToggleButton = (theme) => {
      const lights = document.querySelectorAll('#theme-btn-light');
      const darks = document.querySelectorAll('#theme-btn-dark');
      
      if (theme === 'dark') {
        lights.forEach(l => {
          l.className = "p-1.5 rounded-full text-slate-400 dark:text-zinc-500 bg-transparent transition-all hover:scale-105 cursor-pointer";
        });
        darks.forEach(d => {
          d.className = "p-1.5 rounded-full text-white bg-brand-orange shadow-sm transition-all hover:scale-105 cursor-pointer";
        });
      } else {
        lights.forEach(l => {
          l.className = "p-1.5 rounded-full text-white bg-brand-orange shadow-sm transition-all hover:scale-105 cursor-pointer";
        });
        darks.forEach(d => {
          d.className = "p-1.5 rounded-full text-slate-400 dark:text-zinc-500 bg-transparent transition-all hover:scale-105 cursor-pointer";
        });
      }
    };
    
    updateToggleButton(activeTheme);
    
    const setTheme = (theme) => {
      if (theme === 'dark') {
        html.classList.add('dark');
        html.classList.remove('light');
      } else {
        html.classList.add('light');
        html.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
      updateToggleButton(theme);
      window.dispatchEvent(new Event('theme-change'));
    };

    // Attach click events using delegation to handle all elements
    document.addEventListener('click', (e) => {
      const lightBtn = e.target.closest('#theme-btn-light');
      const darkBtn = e.target.closest('#theme-btn-dark');
      
      if (lightBtn) {
        e.preventDefault();
        setTheme('light');
      }
      if (darkBtn) {
        e.preventDefault();
        setTheme('dark');
      }
    });
  });
})();
