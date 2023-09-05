import pandas as pd

# Load participant logs
participant_logs = pd.concat([pd.read_csv(f'../data/Activity Logs/ParticipantStatusLogs{i}.csv') for i in range(1, 73)])

# Extract unique participantId-apartmentId mappings
unique_mappings = participant_logs[['participantId', 'apartmentId']].drop_duplicates()

# Merge to get buildingId
apartments = pd.read_csv('../data/Attributes/Apartments.csv')
result = unique_mappings.merge(apartments[['apartmentId', 'buildingId']], on='apartmentId', how='left')
result = result.sort_values('participantId')

result.to_csv('../data/ParticipantIDBuildingIDMapping.csv', index=False)