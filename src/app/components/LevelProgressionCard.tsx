// UX-DRIVEN LEVEL PROGRESSION VISUAL
// Current level = cerah, completed = hijau, locked = abu2 pudar

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';
import { Badge } from '@/app/components/ui/badge';
import { getAllLevelsByRole, getLevelByRole } from '@/data/levelingSystem';
import { CheckCircle, Lock, Circle } from 'lucide-react';

interface LevelProgressionCardProps {
  role: 'user' | 'moderator' | 'admin';
  currentPoints: number;
}

export function LevelProgressionCard({ role, currentPoints }: LevelProgressionCardProps) {
  const allLevels = getAllLevelsByRole(role);
  const currentLevel = getLevelByRole(role, currentPoints);
  
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg">Level Progression</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allLevels.map((level, index) => {
            const isCompleted = currentPoints >= level.maxPoints && level.level < allLevels.length;
            const isCurrent = level.level === currentLevel.level;
            const isLocked = currentPoints < level.minPoints;
            
            // Calculate progress for current level
            const progress = isCurrent 
              ? ((currentPoints - level.minPoints) / (level.maxPoints - level.minPoints)) * 100 
              : isCompleted 
              ? 100 
              : 0;
            
            return (
              <div 
                key={level.level}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isCurrent 
                    ? 'bg-gradient-to-r from-[#0B6E4F] to-[#0D8A62] border-[#0B6E4F] shadow-lg' 
                    : isCompleted
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {/* Status Icon */}
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : isCurrent ? (
                      <Circle className={`w-6 h-6 ${isCurrent ? 'text-white' : 'text-gray-400'}`} />
                    ) : (
                      <Lock className="w-6 h-6 text-gray-400" />
                    )}
                    
                    {/* Level Info */}
                    <div>
                      <div className={`font-bold ${isCurrent ? 'text-white' : isCompleted ? 'text-green-900' : 'text-gray-600'}`}>
                        {level.badge} Level {level.level} - {level.name}
                      </div>
                      <div className={`text-sm ${isCurrent ? 'text-white/80' : isCompleted ? 'text-green-700' : 'text-gray-500'}`}>
                        {level.minPoints} - {level.maxPoints === 999999 ? '∞' : level.maxPoints} poin
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  {isCurrent && (
                    <Badge className="bg-[#FDB913] text-black font-bold">
                      CURRENT
                    </Badge>
                  )}
                  {isCompleted && !isCurrent && (
                    <Badge className="bg-green-600 text-white">
                      COMPLETED
                    </Badge>
                  )}
                  {isLocked && (
                    <Badge variant="outline" className="text-gray-500">
                      LOCKED
                    </Badge>
                  )}
                </div>
                
                {/* Progress Bar (only for current level) */}
                {isCurrent && level.maxPoints !== 999999 && (
                  <div className="mt-3">
                    <Progress 
                      value={progress} 
                      className="h-2 bg-white/30"
                    />
                    <div className="text-xs text-white/90 mt-1">
                      {Math.round(progress)}% complete • {level.maxPoints - currentPoints} poin to next level
                    </div>
                  </div>
                )}
                
                {/* Completed Progress */}
                {isCompleted && !isCurrent && (
                  <div className="mt-2">
                    <Progress value={100} className="h-2 bg-green-200" />
                  </div>
                )}
                
                {/* Perks */}
                <div className="mt-3">
                  <div className={`text-xs font-semibold mb-1 ${
                    isCurrent ? 'text-white/90' : isCompleted ? 'text-green-800' : 'text-gray-500'
                  }`}>
                    Perks:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {level.perks.map((perk, idx) => (
                      <Badge 
                        key={idx}
                        variant="outline"
                        className={`text-xs ${
                          isCurrent 
                            ? 'bg-white/20 text-white border-white/40' 
                            : isCompleted
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}
                      >
                        {perk}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
