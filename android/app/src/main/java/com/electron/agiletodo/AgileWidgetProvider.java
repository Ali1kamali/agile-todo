package com.electron.agiletodo;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class AgileWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.duolingo_widget_layout);

        // Clicking widget launches main activity
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_layout, pendingIntent);

        // Update default state
        views.setTextViewText(R.id.widget_title, "Agile Todo");
        views.setTextViewText(R.id.widget_subtitle, "دوره رشد فردی فعال");
        views.setTextViewText(R.id.widget_percent, "100%");
        views.setProgressBar(R.id.widget_progress, 100, 45, false);
        views.setTextViewText(R.id.widget_footer, "استمرار روزانه رمز موفقیته! 🎯");

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
