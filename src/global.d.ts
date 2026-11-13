declare const __APP_VERSION__: string;

interface Window {
  /** Android 原生返回手势调用：关闭最上层弹层，返回是否已处理。 */
  __dongfenCloseTopModal?: () => boolean;
}