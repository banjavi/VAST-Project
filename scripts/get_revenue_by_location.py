
import pandas as pd


## Load ParticipantStatusLogs
logs = pd.DataFrame([])
for i in range(1, 73):
    logs = pd.concat([logs, pd.read_csv(f'../data/Activity Logs/ParticipantStatusLogs{i}.csv')])

logs['timestamp'] = pd.to_datetime(logs['timestamp'])
logs['year_month'] = logs['timestamp'].dt.year * 100 + logs['timestamp'].dt.month
logs = logs.drop_duplicates()


## School Revenue
fin = pd.read_csv('../data/Journals/FinancialJournal.csv').drop_duplicates()  # NOTE: FinancialJournal includes data up to 2023-05-25. ParticipantStatusLogs includes data up to 2023-05-24
schools = pd.read_csv('../data/Attributes/Schools.csv').drop_duplicates()

fin['amount'] = fin['amount'].round(2)
fin['revenue'] = abs(fin['amount'])         # Make $ amount positive for computing revenue
fin['timestamp'] = pd.to_datetime(fin['timestamp'])
fin['year_month'] = fin['timestamp'].dt.year * 100 + fin['timestamp'].dt.month
fin['date'] = fin['timestamp'].dt.date

schools['monthlyCostNeg'] = (schools['monthlyCost'] * -1).round(2)      # Make $ monthly cost negetive to join w/ fin df

school_rev = (pd.merge(left=schools, right=fin[fin['category'] == 'Education'], left_on='monthlyCostNeg', right_on='amount', how='inner')
    .groupby(by=['date', 'schoolId', 'buildingId', 'location'])[['revenue']]
    .sum()
    .reset_index()      # Make groupby index into columns
    .rename(columns={'schoolId': 'unitId'})
)
school_rev['type'] = 'school'
# school_rev
#    date	     unitId	  buildingId	location	                                    revenue     type
# 0	 2022-03-01	 0	      662	        POINT (-376.7505037068263 1607.9843212558562)	1870.26     school
# 1	 2022-03-01	 450	  943	        POINT (-2597.447677094323 3194.1547530883445)	10389.96    school


## Apartment Revenue
apartments = pd.read_csv('../data/Attributes/Apartments.csv').drop_duplicates()

logs_finShelter = pd.merge(left=logs, right=fin[fin['category']=='Shelter'], on=['participantId', 'timestamp'], how='inner')        # Join logs and fin (Shelter) to get locations of apartments
apartment_rev = (pd.merge(left=logs_finShelter, right=apartments, on='apartmentId', how='inner')                                    # Join ^ and apartments to get apartmentId and buildingId
    .groupby(by=['date', 'apartmentId', 'buildingId', 'location'])[['revenue']]                                                     # Group ^ by date and sum $ amount spent on 'Shelter' to get apartment revenue by date
    .sum()      
    .reset_index()
    .rename(columns={'apartmentId': 'unitId'})
)
apartment_rev['type'] = 'apartment'
# apartment_rev
#    date	       unitId	buildingId	location	                                    revenue   type
# 0	 2022-03-01	   1.0	    340	        POINT (1077.6979444315298 648.4427163702453)	768.16    apartment
# 1	 2022-03-01	   2.0	    752	        POINT (-185.9292838076562 1520.3270983045118)	1014.55   apartment


## Restaurant Revenue
restaurants = pd.read_csv('../data/Attributes/Restaurants.csv').drop_duplicates()

logs_finRest = pd.merge(left=logs, right=fin[(fin['category']=='Food') | (fin['category']=='Recreation')], on=['participantId', 'timestamp'], how='inner')       # Join logs and fin (food) to get the locations of restaurants
restaurant_rev = (pd.merge(left=logs_finRest, right=restaurants, left_on='currentLocation', right_on='location', how='inner')                                    # Join ^ and restaurants to get restaurantId and buildingId
    .groupby(by=['date', 'restaurantId', 'buildingId', 'location'])[['revenue']]                                                                                 # Group ^ by date and sum $ amount spent of 'Food' to get restaurant revenue by date
    .sum()
    .reset_index()
    .rename(columns={'restaurantId': 'unitId'})
)
restaurant_rev['type'] = 'restaurant'
# restaurant_rev
#    date	    unitId	buildingId	location	                                            revenue   type
# 0	 2022-03-01	445	            304	        POINT (631.5130723031391 2001.4772026036535)	113.30    restaurant
# 1	 2022-03-01	446	            308	        POINT (413.840000705876 1194.128694228948)	    195.99    restaurant


## Pub Revenue
pubs = pd.read_csv('../data/Attributes/Pubs.csv').drop_duplicates()

logs_finPub = pd.merge(left=logs, right=fin[(fin['category']=='Recreation') | (fin['category']=='Food')], on=['participantId', 'timestamp'], how='inner')       # Join logs and fin (recreation) to get the locations of pubs  -- some 'Food' locations are pubs
pub_rev = (pd.merge(left=logs_finPub, right=pubs, left_on='currentLocation', right_on='location', how='inner')                                                  # Join ^ and pubs to get pubId and buildingId
    .groupby(by=['date', 'pubId', 'buildingId', 'location'])[['revenue']]                                                                                       # Group ^ by date and sum $ amount spent of 'Recreation' to get pub revenue by date
    .sum()
    .reset_index()
    .rename(columns={'pubId': 'unitId'})
)
pub_rev['type'] = 'pub'
# pub_rev
#   date	    unitId	buildingId	location	                                  revenue    type
# 0	2022-03-01	442	    556	        POINT (964.4380231713202 3991.603473784208)	  1264.08    pub
# 1	2022-03-01	443	    29	        POINT (1809.880173357865 4339.172426035451)	  926.29     pub


## Business (All) Revenue
daily_revenue_by_business_location = pd.concat([school_rev, apartment_rev, restaurant_rev, pub_rev])
daily_revenue_by_business_location.to_csv('../data/DailyRevenueByBusinessLocation.csv', index=False)    # ~2.3 MB



