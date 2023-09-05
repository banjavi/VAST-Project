import pandas as pd

# Read in the two CSV files
checkin_df = pd.read_csv('../data/Journals/CheckinJournal.csv')
financial_df = pd.read_csv('../data/Journals/FinancialJournal.csv')

financial_df = financial_df.loc[(financial_df['category'] == 'Recreation') 
                                | (financial_df['category'] == 'Food') 
                                | (financial_df['category'] == 'Shelter') 
                                | (financial_df['category'] == 'Education')]
financial_df['timestamp'] = pd.to_datetime(financial_df['timestamp'])
financial_df['timestamp'] = financial_df['timestamp'].dt.strftime('%Y-%m-%d')
financial_df['amount'] = financial_df['amount'].abs()
financial_df['category'] = financial_df['category'].replace({'Food': 'Restaurants', 'Recreation': 'Pubs', 'Education': 'Schools', 'Shelter': 'Apartments'})

daily_totals = financial_df.groupby(['category', 'timestamp'])['amount'].sum()
daily_totals = daily_totals.reset_index()

daily_totals.to_csv('../data/DailyTotalByCategory.csv', index=False)