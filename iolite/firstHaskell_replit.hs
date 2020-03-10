

data Trin = 
        Yes
    |   No  String
    |   Untrans    String 
    deriving(Show)


data Patient = Patient { 
      first :: String
    , bp :: Int } deriving (Show)

karen = Patient { first="karen", bp=180 }
class Trial t where
    can t Patient :: t -> Patient -> Trin
 
rawTrial47 = RawString "Blood Pressure over 150"
--fullTrial47 = 
main = do
    putStrLn "Hello World!"
    putStrLn $ show $ No "some reason bugbug"
    putStrLn $ show $ trial47 karen
    putStrLn "done"


