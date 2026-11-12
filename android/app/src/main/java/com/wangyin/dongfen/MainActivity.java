package com.wangyin.dongfen;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

import org.json.JSONObject;

import java.io.OutputStream;

public class MainActivity extends Activity {
    private static final String APP_ORIGIN = "https://appassets.androidplatform.net";
    private static final int REQUEST_FILE_CHOOSER = 1001;
    private static final int REQUEST_CREATE_DOCUMENT = 1002;

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private byte[] pendingExportData;
    private String pendingExportRequestId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.parseColor("#18332B"));
        getWindow().setNavigationBarColor(Color.parseColor("#F3EFE6"));

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#F3EFE6"));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.addJavascriptInterface(new AndroidFileBridge(), "AndroidApp");

        webView.setWebViewClient(new WebViewClientCompat() {
            @Override
            public WebResourceResponse shouldInterceptRequest(@NonNull WebView view,
                                                              @NonNull WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(@NonNull WebView view,
                                                    @NonNull WebResourceRequest request) {
                Uri url = request.getUrl();
                if (APP_ORIGIN.equals(url.getScheme() + "://" + url.getHost())) {
                    return false;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, url));
                } catch (Exception ignored) {
                    // 没有可处理外部链接的应用时保持当前页面。
                }
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(@NonNull WebView view,
                                             @NonNull ValueCallback<Uri[]> callback,
                                             @NonNull FileChooserParams params) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), REQUEST_FILE_CHOOSER);
                    return true;
                } catch (Exception exception) {
                    filePathCallback = null;
                    callback.onReceiveValue(null);
                    return false;
                }
            }
        });

        setContentView(webView);
        webView.loadUrl(APP_ORIGIN + "/assets/www/index.html");
    }

    private class AndroidFileBridge {
        @JavascriptInterface
        public void saveText(final String filename, final String mime, final String base64) {
            saveText(filename, mime, base64, null);
        }

        @JavascriptInterface
        public void saveText(final String filename, final String mime, final String base64, final String requestId) {
            runOnUiThread(() -> {
                try {
                    String normalizedMime = mime == null || mime.isEmpty()
                            ? "application/octet-stream"
                            : mime.split(";")[0];
                    pendingExportData = Base64.decode(base64, Base64.NO_WRAP);
                    pendingExportRequestId = requestId;
                    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType(normalizedMime);
                    intent.putExtra(Intent.EXTRA_TITLE, filename);
                    startActivityForResult(intent, REQUEST_CREATE_DOCUMENT);
                } catch (Exception exception) {
                    pendingExportData = null;
                    pendingExportRequestId = null;
                    notifyExportResult(requestId, "failed", exception.getMessage());
                    Toast.makeText(MainActivity.this, "导出失败，请重试", Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    private void notifyExportResult(final String requestId, final String status, final String message) {
        if (requestId == null || webView == null) return;
        final String script = "window.AndroidFileResult&&window.AndroidFileResult("
                + JSONObject.quote(requestId) + ","
                + JSONObject.quote(status) + ","
                + JSONObject.quote(message == null ? "" : message) + ");";
        webView.post(() -> {
            if (webView != null) webView.evaluateJavascript(script, null);
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == REQUEST_FILE_CHOOSER) {
            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null) {
                ClipData clipData = data.getClipData();
                if (clipData != null) {
                    results = new Uri[clipData.getItemCount()];
                    for (int index = 0; index < clipData.getItemCount(); index++) {
                        results[index] = clipData.getItemAt(index).getUri();
                    }
                } else if (data.getData() != null) {
                    results = new Uri[]{data.getData()};
                }
            }
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
            return;
        }

        if (requestCode == REQUEST_CREATE_DOCUMENT) {
            String requestId = pendingExportRequestId;
            if (resultCode != RESULT_OK || data == null || data.getData() == null
                    || pendingExportData == null) {
                notifyExportResult(requestId, "cancelled", "");
            } else {
                try (OutputStream output = getContentResolver().openOutputStream(data.getData())) {
                    if (output != null) {
                        output.write(pendingExportData);
                        notifyExportResult(requestId, "saved", "");
                        Toast.makeText(this, "已保存", Toast.LENGTH_SHORT).show();
                    } else {
                        notifyExportResult(requestId, "failed", "无法打开保存位置");
                        Toast.makeText(this, "保存失败，请重试", Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception exception) {
                    notifyExportResult(requestId, "failed", exception.getMessage());
                    Toast.makeText(this, "保存失败，请重试", Toast.LENGTH_SHORT).show();
                }
            }
            pendingExportData = null;
            pendingExportRequestId = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}