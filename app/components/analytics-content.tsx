"use client";
import React from 'react';
import { Card, Block, BlockTitle } from 'konsta/react';
import { IonIcon } from '@ionic/react';
import { statsChartOutline } from 'ionicons/icons';

const AnalyticsContent = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <IonIcon icon={statsChartOutline} className="text-4xl text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No data to show</h2>
            <p className="text-slate-500 max-w-xs mx-auto">
                Once transactions occur, your business analytics will be displayed here.
            </p>
        </div>
    );
};

export default AnalyticsContent;
