import pandas as pd
import gc

# Read the CSV files into pandas dataframes
participant_logs = pd.concat([pd.read_csv(f'../data/Activity Logs/ParticipantStatusLogs{i}.csv') for i in range(1, 73)])
print('done reading logs')
employers = pd.read_csv('../data/Attributes/Employers.csv')
print('done reading employers')
jobs = pd.read_csv('../data/Attributes/Jobs.csv')
print('done reading jobs')

# Merge the dataframes to associate each participant log entry with its employer and building
merged = pd.merge(participant_logs, jobs, on='jobId')
print('done merging participants and jobs')

del participant_logs
del jobs
gc.collect()
print('freed space')

merged = pd.merge(merged, employers, on='employerId')
print('done merging with employers')

del employers
gc.collect()
print('deleted employers')

# Convert the timestamp column to a datetime object and extract the date
merged['datetime'] = pd.to_datetime(merged['timestamp'])
merged['date'] = merged['datetime'].dt.date
print('done converting date')

counts = merged.groupby(['employerId', 'buildingId', 'date']).agg({'participantId': 'nunique'}).reset_index()

del merged
gc.collect()
print('deleted merged')

# Rename the columns for clarity
counts.columns = ['employerId', 'buildingId', 'date', 'positionsFilled']

# Write the counts dataframe to a CSV file without indexes
counts.to_csv('../data/DailyEmployeesByEmployer.csv', index=False)