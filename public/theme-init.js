try {
  var savedTheme = localStorage.getItem('color-scheme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    var meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.content = savedTheme;
    }
  }
} catch {}
