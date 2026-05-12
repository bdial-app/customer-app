package com.tijarah.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private int mBottomSafeArea = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Android 15+ (targetSdk 35+) forces edge-to-edge and ignores setDecorFitsSystemWindows(true).
        // Drive edge-to-edge explicitly so the WebView starts below the status bar.
        // The bottom is NOT padded — the WebView extends behind the navigation bar
        // so the app's own bottom bar fills that area (no grey patch).
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Transparent navigation bar so the WebView content shows through
        getWindow().setNavigationBarColor(Color.TRANSPARENT);

        // Light navigation bar icons (dark icons on transparent background)
        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightNavigationBars(true);

        View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            // Only pad the top (status bar). Bottom padding is handled by CSS --sab variable.
            v.setPadding(bars.left, bars.top, bars.right, 0);

            // Calculate bottom safe area in CSS pixels (dp) and inject into WebView
            float density = getResources().getDisplayMetrics().density;
            mBottomSafeArea = Math.round(bars.bottom / density);
            injectSafeAreaBottom();

            return WindowInsetsCompat.CONSUMED;
        });

        // Re-inject after page loads (insets listener fires before page is ready)
        content.postDelayed(this::injectSafeAreaBottom, 500);
        content.postDelayed(this::injectSafeAreaBottom, 1500);

        createNotificationChannel();
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Re-inject on resume in case page was reloaded
        View content = findViewById(android.R.id.content);
        content.postDelayed(this::injectSafeAreaBottom, 300);
    }

    /**
     * Inject the bottom safe area (navigation bar height) as a CSS variable
     * into the WebView. This is needed because Android WebView does not
     * support env(safe-area-inset-bottom) for the navigation bar.
     */
    private void injectSafeAreaBottom() {
        try {
            WebView wv = getBridge().getWebView();
            String js = "document.documentElement.style.setProperty('--sab','" + mBottomSafeArea + "px')";
            wv.post(() -> wv.evaluateJavascript(js, null));
        } catch (Exception e) {
            // Bridge or WebView not ready yet — will retry via postDelayed or next insets change
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "default",
                "Default Notifications",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Tijarah push notifications");
            channel.enableVibration(true);
            channel.setShowBadge(true);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
}
