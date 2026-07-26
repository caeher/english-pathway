export const THEME_STORAGE_KEY = 'english-pathway-theme'

export const themeInitScript = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(!raw)return;var parsed=JSON.parse(raw);if(parsed&&parsed.state&&parsed.state.dark){document.documentElement.classList.add('dark')}}catch(e){}})();`
