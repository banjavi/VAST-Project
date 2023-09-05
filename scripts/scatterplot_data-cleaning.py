import pandas as pd

# read in the CSV file and specify the data types of the columns
dtypes = {
    'participantId': int,
    'category': str,
    'amount': float
}
df = pd.read_csv('data/Journals/FinancialJournal.csv', header=0, dtype=dtypes, parse_dates=['timestamp'])

# drop the first 2278 rows
df.drop(df.index[:2278], inplace=True)

# create a new column for the category based on the aggregated data
df['category'] = df.apply(lambda x: 'wage' if x['category'] == 'Wage' else 'expense', axis=1)

# create a new DataFrame with aggregated data
agg_df = df.groupby([pd.Grouper(key='timestamp', freq='M'), 'participantId', 'category']).agg({'amount': 'sum'}).reset_index()

# rename the columns of the aggregated DataFrame
agg_df.rename(columns={'timestamp': 'month'}, inplace=True)

# modify the month column to only show year and month
agg_df['month'] = pd.to_datetime(agg_df['month']).dt.strftime('%Y-%m')

# round the amount column to the nearest integer
agg_df['amount'] = agg_df['amount'].round().astype(int).abs()

# re-order the columns
agg_df = agg_df.reindex(columns=['participantId', 'month', 'category', 'amount'])

# Filter out participants that do not have 2 entries for every month
months = ['2022-03', '2022-04', '2022-05','2022-06', '2022-07', '2022-08', '2022-09', '2022-10',
  '2022-11', '2022-12', '2023-01', '2023-02', '2023-03', '2023-04', '2023-05']
to_remove = set()
for participantId in agg_df['participantId'].unique():
    count = len(agg_df[agg_df['participantId'] == participantId])
    if count < 2*len(months):
        to_remove.add(participantId)

agg_df = agg_df[~agg_df['participantId'].isin(to_remove)]
# export the aggregated DataFrame to a CSV file
agg_df.to_csv('data/Journals/AggregatedFinancialJournal.csv', index=False)
