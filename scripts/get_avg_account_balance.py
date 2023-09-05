import pandas as pd

# Load participant logs
participant_logs = pd.concat([pd.read_csv(f'../data/Activity Logs/ParticipantStatusLogs{i}.csv') for i in range(1, 73)])
participant_logs['month'] = pd.to_datetime(participant_logs['timestamp']).dt.strftime('%Y-%m')

# Calculate mean available balance per month and participant
average_balances = participant_logs.groupby(['month', 'participantId'])['availableBalance'].mean().reset_index()

# Rename columns and reorder
average_balances.columns = ['month', 'participantID', 'averageBalance']

# Load participant metadata and merge with average_balances
participant_metadata = pd.read_csv('../data/Attributes/Participants.csv')
result = pd.merge(average_balances, participant_metadata, left_on='participantID', right_on='participantId', how='left').drop(columns=['participantId'])

# Write to a CSV file
result.to_csv('../data/AveragedParticipantBalances.csv', index=False)