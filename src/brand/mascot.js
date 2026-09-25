// Маскот лежит в src, а не в public/: при сборке файл получает имя с хэшем,
// и заменённая картинка доходит до вернувшихся посетителей. Файлы из public/
// деплой кэширует на год под тем же именем (см. .github/workflows/deploy.yml).
// Картинки — из бренд-кита (welcome ← mascot-hello, finish ← mascot-hint,
// empty ← mascot-search), см. docs/brand/BRAND_GUIDELINES.md.
import welcome from "./mascot/welcome.png";
import finish from "./mascot/finish.png";
import correct from "./mascot/correct.png";
import wrong from "./mascot/wrong.png";
import empty from "./mascot/empty.png";

export const MASCOT = { welcome, finish, correct, wrong, empty };
