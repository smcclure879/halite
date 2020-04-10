{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE DeriveGeneric #-}

import Data.Aeson
import GHC.Generics
import qualified Data.ByteString.Lazy as B

jsonFile :: FilePath
jsonFile = "karen.json"

getJSON :: IO B.ByteString
getJSON = B.readFile jsonFile



main :: IO()
main = do
  karen <- (eitherDecode <$> getJSON)   :: IO (Either String Object)
  --y <- ( decode x )  :: IO ( Maybe Object ) 
  case karen of
    Left err -> putStrLn $ show $ err
    Right obj -> do
      putStrLn $ show $ karen
      putStrLn $ show $ Object obj


