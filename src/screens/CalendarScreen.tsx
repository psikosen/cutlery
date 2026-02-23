import { useMemo, useState } from 'react';
import { DAILY_CALENDAR_REWARDS } from '../data/dailyCalendarRewards';
import { useGame } from '../hooks/useGameState';

export function CalendarScreen() {
  const { state, claimDailyCalendarReward } = useGame();
  const [claimStatus, setClaimStatus] = useState('');
  const { calendar, player } = state;

  const rewardTiles = useMemo(() => {
    const totalDays = DAILY_CALENDAR_REWARDS.length;
    const claimedAllToday = !calendar.can_claim_today && calendar.cycle_index === 0;
    return DAILY_CALENDAR_REWARDS.map((reward, index) => {
      const isClaimed = claimedAllToday || (!claimedAllToday && index < calendar.cycle_index);
      const isNext = index === calendar.cycle_index;
      return {
        ...reward,
        state: isClaimed ? 'claimed' : isNext ? 'next' : 'upcoming',
        cycleLabel: `${index + 1}/${totalDays}`,
      };
    });
  }, [calendar.can_claim_today, calendar.cycle_index]);

  if (!player) return null;

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: '#ffd778', marginBottom: 12, fontWeight: 600 }}>
        ⌜ DAILY CALENDAR ⌝
      </div>

      <div style={{
        background: 'rgba(10, 15, 30, 0.84)',
        borderRadius: 12,
        border: '1px solid rgba(255, 215, 120, 0.26)',
        padding: '14px 14px 12px',
        marginBottom: 14,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            Next Reward: Day {calendar.next_reward.day}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#ffd778' }}>
            +{calendar.next_reward.gold}G
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>
          {calendar.next_reward.title}
        </div>
        <button
          onClick={async () => {
            const result = await claimDailyCalendarReward();
            setClaimStatus(result.message);
          }}
          disabled={!calendar.can_claim_today}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: `1px solid ${calendar.can_claim_today ? 'rgba(255, 215, 120, 0.5)' : 'rgba(255,255,255,0.12)'}`,
            background: calendar.can_claim_today ? 'rgba(255, 215, 120, 0.16)' : 'rgba(255,255,255,0.05)',
            color: calendar.can_claim_today ? '#fff' : 'rgba(255,255,255,0.35)',
            fontSize: 12,
            letterSpacing: 1,
            fontWeight: 700,
            cursor: calendar.can_claim_today ? 'pointer' : 'default',
          }}
        >
          {calendar.can_claim_today ? 'CLAIM DAILY REWARD' : 'CLAIMED TODAY'}
        </button>
        {claimStatus && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.52)' }}>
            {claimStatus}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{
          flex: 1,
          background: 'rgba(10, 15, 30, 0.8)',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '10px 12px',
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Current Claim Streak</div>
          <div style={{ fontSize: 24, color: '#fff', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>
            {calendar.consecutive_claims}
          </div>
        </div>
        <div style={{
          flex: 1,
          background: 'rgba(10, 15, 30, 0.8)',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '10px 12px',
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Best Claim Streak</div>
          <div style={{ fontSize: 24, color: '#fff', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>
            {calendar.best_consecutive_claims}
          </div>
        </div>
      </div>

      <div style={{
        background: 'rgba(10, 15, 30, 0.82)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        padding: 12,
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: '#00ccff', marginBottom: 10 }}>
          30-DAY REWARD LOOP
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 8,
        }}>
          {rewardTiles.map((reward) => {
            const isClaimed = reward.state === 'claimed';
            const isNext = reward.state === 'next';
            return (
              <div
                key={reward.day}
                style={{
                  borderRadius: 8,
                  padding: '8px 6px',
                  border: `1px solid ${
                    isClaimed
                      ? 'rgba(120, 255, 195, 0.4)'
                      : isNext
                      ? 'rgba(255, 215, 120, 0.5)'
                      : 'rgba(255,255,255,0.1)'
                  }`,
                  background: isClaimed
                    ? 'rgba(120, 255, 195, 0.08)'
                    : isNext
                    ? 'rgba(255, 215, 120, 0.12)'
                    : 'rgba(255,255,255,0.03)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>
                  Day {reward.day}
                </div>
                <div style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>
                  +{reward.gold}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', marginTop: 3, minHeight: 24 }}>
                  {reward.title}
                </div>
                <div style={{
                  marginTop: 4,
                  fontSize: 9,
                  color: isClaimed ? '#7BFFC3' : isNext ? '#ffd778' : 'rgba(255,255,255,0.36)',
                }}>
                  {isClaimed ? 'CLAIMED' : isNext ? 'NEXT' : reward.cycleLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
