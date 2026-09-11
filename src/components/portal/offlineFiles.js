/**
 * The phone's side of saved lessons (#189): where a lesson's video is kept.
 *
 * Directory.Data is the app's private storage: no permission prompt, no other
 * app can read it, and Android removes it with the app. The plugin is loaded
 * only when used, so the website bundle never fetches it, the same way
 * nativeAuth loads @capacitor/browser.
 */
import { isNative } from "../../lib/apiBase";

let plugin = null;
function filesystem() {
  plugin = plugin || import("@capacitor/filesystem");
  return plugin;
}

/** Saving lessons is an app feature; the website only streams. */
export function canSaveLessons() {
  return isNative();
}

/** The file store downloadLesson writes through. */
export const lessonFiles = {
  /** Bytes saved so far; 0 when there is no file yet. */
  async size(path) {
    const { Filesystem, Directory } = await filesystem();
    try {
      const info = await Filesystem.stat({ path, directory: Directory.Data });
      return Number(info.size) || 0;
    } catch {
      return 0;
    }
  },

  /** An empty file, with its folder, ready to append to. */
  async reset(path) {
    const { Filesystem, Directory } = await filesystem();
    await Filesystem.writeFile({ path, data: "", directory: Directory.Data, recursive: true });
  },

  /** With no encoding given, the plugin reads `data` as base64: binary-safe. */
  async append(path, base64) {
    const { Filesystem, Directory } = await filesystem();
    await Filesystem.appendFile({ path, data: base64, directory: Directory.Data });
  },

  async remove(path) {
    const { Filesystem, Directory } = await filesystem();
    try {
      await Filesystem.deleteFile({ path, directory: Directory.Data });
    } catch {
      // Already gone: deleting is done either way
    }
  },

  /**
   * A URL the WebView's <video> can play the saved file from. It is served by
   * the app's own local server, which answers range requests, so seeking works
   * with no connection.
   */
  async playableUrl(path) {
    const { Filesystem, Directory } = await filesystem();
    const { uri } = await Filesystem.getUri({ path, directory: Directory.Data });
    const cap = globalThis.Capacitor;
    return cap && typeof cap.convertFileSrc === "function" ? cap.convertFileSrc(uri) : uri;
  },
};
