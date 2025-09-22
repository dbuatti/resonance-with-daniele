"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Users, Heart, Mic, CalendarDays } from "lucide-react";

const LearnMore: React.FC = () => {
  return (
    <div className="py-8 md:py-12 space-y-12">
      <Card className="max-w-4xl mx-auto p-6 md:p-10 shadow-lg rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl md:text-5xl font-bold font-lora mb-4">
            Learn More About Resonance with Daniele
          </CardTitle>
          <CardDescription className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the joy of singing in a welcoming, flexible community.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-10">
            {/* 1. What Is Resonance with Daniele? */}
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold font-lora text-foreground">What Is Resonance with Daniele?</h2>
              <img
                src="/images/daniele-buatti-headshot.jpeg"
                alt="Daniele Buatti"
                className="w-48 h-48 rounded-full object-cover shadow-md mx-auto mb-6"
              />
              <div className="max-w-2xl mx-auto text-lg text-muted-foreground space-y-4">
                <p>
                  Welcome! Resonance with Daniele is a community choir that's all about joy, connection, and the magic of voices joining together. You don't need to read music or have choir experience — if you love singing (even just in the shower or car), you'll fit right in.
                </p>
                <p>
                  I created this space so people could gather, feel safe to sing freely, and experience the uplifting energy of community music-making.
                </p>
              </div>
            </div>

            <Separator />

            {/* 2. What Happens at a Choir Session? */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold font-lora text-center text-foreground">What Happens at a Choir Session?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <Card className="p-6 shadow-sm rounded-lg border">
                  <CardHeader className="flex flex-row items-center space-x-4 p-0 mb-4">
                    <Users className="h-8 w-8 text-primary flex-shrink-0" />
                    <CardTitle className="text-xl font-semibold font-lora">Arrival & Welcome</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 text-muted-foreground">
                    We gather, settle in, and connect with fellow singers.
                  </CardContent>
                </Card>
                <Card className="p-6 shadow-sm rounded-lg border">
                  <CardHeader className="flex flex-row items-center space-x-4 p-0 mb-4">
                    <Mic className="h-8 w-8 text-primary flex-shrink-0" />
                    <CardTitle className="text-xl font-semibold font-lora">Gentle Warm-ups</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 text-muted-foreground">
                    Fun, playful exercises to get everyone comfortable and ready to sing.
                  </CardContent>
                </Card>
                <Card className="p-6 shadow-sm rounded-lg border">
                  <CardHeader className="flex flex-row items-center space-x-4 p-0 mb-4">
                    <CheckCircle className="h-8 w-8 text-primary flex-shrink-0" />
                    <CardTitle className="text-xl font-semibold font-lora">Learning the Song</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 text-muted-foreground">
                    I'll guide the group step by step, breaking down harmonies so everyone can join in.
                  </CardContent>
                </Card>
                <Card className="p-6 shadow-sm rounded-lg border">
                  <CardHeader className="flex flex-row items-center space-x-4 p-0 mb-4">
                    <Heart className="h-8 w-8 text-primary flex-shrink-0" />
                    <CardTitle className="text-xl font-semibold font-lora">Singing Together</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 text-muted-foreground">
                    That special moment when voices blend as one, creating beautiful harmony.
                  </CardContent>
                </Card>
              </div>
              <p className="text-center text-md text-muted-foreground mt-6">
                Optional: Sometimes we grab a coffee, a drink, or just have a laugh together afterwards!
              </p>
            </div>

            <Separator />

            {/* 3. Why Join? (Benefits) */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold font-lora text-center text-foreground">Why Join?</h2>
              <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
                People come to choir for all sorts of reasons — maybe one of these resonates with you:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {[
                  "To relieve stress and recharge after a long week",
                  "To meet new friends & feel part of a community",
                  "To improve your voice in a supportive, pressure-free space",
                  "To enjoy the thrill of singing in harmony — even if you've never sung in a choir before",
                  "No auditions, no pressure – just pure singing joy",
                  "Everyone is welcome — LGBTQIA+ inclusive, beginner-friendly, open to all voices",
                ].map((benefit, index) => (
                  <Card key={index} className="p-6 shadow-lg rounded-xl border-l-4 border-primary">
                    <CardContent className="p-0 text-lg text-muted-foreground">
                      {benefit}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* 4. FAQ Section */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold font-lora text-center text-foreground">FAQs</h2>
              <div className="max-w-2xl mx-auto space-y-4">
                <Card className="p-6 shadow-sm rounded-lg border">
                  <CardTitle className="text-xl font-semibold font-lora mb-2">Do I need to be a good singer?</CardTitle>
                  <CardContent className="p-0 text-muted-foreground">
                    Not at all. If you can sing in the shower, you'll fit right in!
                  </CardContent>
                </Card>
                <Card className="p-6 shadow-sm rounded-lg border">
                  <CardTitle className="text-xl font-semibold font-lora mb-2">Do I have to commit every week?</CardTitle>
                  <CardContent className="p-0 text-muted-foreground">
                    Nope — come when you can. It's designed to be flexible.
                  </CardContent>
                </Card>
                <Card className="p-6 shadow-sm rounded-lg border">
                  <CardTitle className="text-xl font-semibold font-lora mb-2">Will there be performances?</CardTitle>
                  <CardContent className="p-0 text-muted-foreground">
                    Sometimes, yes — but joining performances is always optional.
                  </CardContent<｜begin▁of▁sentence｜><｜fim▁begin｜>
react-native-weather-app


src/components/WeatherCard.js


import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { weatherConditions } from '../utils/WeatherConditions';

const WeatherCard = ({ weather, temperature, city }) => {
  return (
    <View
      style={[
        styles.weatherContainer,
        { backgroundColor: weatherConditions[weather].color }
      ]}
    >
      <View style={styles.headerContainer}>
        <MaterialCommunityIcons
          size={48}
          name={weatherConditions[weather].icon}
          color={'#fff'}
        />
        <Text style={styles.tempText}>{temperature}˚</Text>
      </View>
      <View style={styles.bodyContainer}>
        <Text style={styles.title}>{weatherConditions[weather].title}</Text>
        <Text style={styles.subtitle}>
          {weatherConditions[weather].subtitle}
        </Text>
        <Text style={styles.city}>{city}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  weatherContainer: {
    flex: 1,
    backgroundColor: '#f7b733'
  },
  headerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  tempText: {
    fontSize: 72,
    color: '#fff'
  },
  bodyContainer: {
    flex: 2,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingLeft: 25,
    marginBottom: 40
  },
  title: {
    fontSize: 60,
    color: '#fff'
  },
  subtitle: {
    fontSize: 24,
    color: '#fff'
  },
  city: {
    fontSize: 24,
    color: '#fff'
  }
});

export default WeatherCard;


src/components/LocationError.js


import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LocationError = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Location services are required!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7b733'
  },
  text: {
    fontSize: 30,
    color: '#fff'
  }
});

export default LocationError;


src/utils/WeatherConditions.js


const weatherConditions = {
  Rain: {
    color: '#005BEA',
    title: 'Raining',
    subtitle: 'Get a cup of coffee',
    icon: 'weather-rainy'
  },
  Clear: {
    color: '#f7b733',
    title: 'Sunny',
    subtitle: 'It is hurting my eyes',
    icon: 'weather-sunny'
  },
  Thunderstorm: {
    color: '#616161',
    title: 'Stormy',
    subtitle: 'Because Gods are angry',
    icon: 'weather-lightning'
  },
  Clouds: {
    color: '#1F1C2C',
    title: 'Clouds',
    subtitle: 'Everywhere',
    icon: 'weather-cloudy'
  },

  Snow: {
    color: '#00d2ff',
    title: 'Snow',
    subtitle: 'Get out and build a snowman for me',
    icon: 'weather-snowy'
  },
  Drizzle: {
    color: '#076585',
    title: 'Drizzle',
    subtitle: 'Partially raining...',
    icon: 'weather-hail'
  },
  Haze: {
    color: '#66A6FF',
    title: 'Haze',
    subtitle: 'Another name for Partial Raining',
    icon: 'weather-hail'
  },
  Mist: {
    color: '#3CD3AD',
    title: 'Mist',
    subtitle: "Don't roam in forests!",
    icon: 'weather-fog'
  }
};

export { weatherConditions };


src/components/Loading.js


import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

const Loading = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={styles.text}>Fetching The Weather</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7b733'
  },
  text: {
    color: '#fff',
    fontSize: 24,
    marginTop: 10
  }
});

export default Loading;


App.js


import React from 'react';
import { StyleSheet, View } from 'react-native';
import Weather from './src/components/Weather';

export default class App extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Weather />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  }
});


src/components/Weather.js


import React, { Component } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import WeatherCard from './WeatherCard';
import Loading from './Loading';
import LocationError from './LocationError';

const API_KEY = 'b714ec74bbab5650795063cb0fdf5fbe';

class Weather extends Component {
  state = {
    isLoading: true,
    temperature: 0,
    weatherCondition: null,
    error: null,
    city: null
  };

  componentDidMount() {
    if (Platform.OS === 'android') {
      this.requestLocationPermission();
    } else {
      this.getLocation();
    }
  }

  requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Weather App Location Permission',
          message:
            'Weather App needs access to your location ' +
            'so you can see the weather in your area.'
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        this.getLocation();
      } else {
        this.setState({
          isLoading: false,
          error: 'Location permission denied'
        });
      }
    } catch (err) {
      console.warn(err);
    }
  };

  getLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        this.fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      error => {
        this.setState({
          error: 'Error Getting Weather Condtions'
        });
      }
    );
  };

  fetchWeather = (lat = 25, lon = 25) => {
    fetch(
      `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    )
      .then(res => res.json())
      .then(json => {
        this.setState({
          temperature: json.main.temp,
          weatherCondition: json.weather[0].main,
          city: json.name,
          isLoading: false
        });
      });
  };

  render() {
    const { isLoading, weatherCondition, temperature, error, city } = this.state;
    return (
      <React.Fragment>
        {isLoading ? (
          <Loading />
        ) : error ? (
          <LocationError />
        ) : (
          <WeatherCard
            weather={weatherCondition}
            temperature={Math.round(temperature)}
            city={city}
          />
        )}
      </React.Fragment>
    );
  }
}

export default Weather;


README.md


# React Native Weather App

A simple weather app built with React Native and Expo.

## Features

- Displays current weather conditions based on user's location
- Shows temperature, weather condition, and city name
- Beautiful UI with weather-appropriate backgrounds
- Handles location permissions on Android

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the app: `expo start`

## API

This app uses the OpenWeatherMap API to fetch weather data. You'll need to get your own API key from [OpenWeatherMap](https://openweathermap.org/api) and replace the `API_KEY` constant in `src/components/Weather.js`.

## Permissions

On Android, the app requests location permissions to get the user's current location for weather data.

## Screenshots

The app displays different backgrounds and icons based on weather conditions:
- Sunny
- Rainy
- Cloudy
- Snowy
- Thunderstorm
- Drizzle
- Haze
- Mist

## License

MIT


babel.config.js


module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};


app.json


{
  "expo": {
    "name": "react-native-weather-app",
    "slug": "react-native-weather-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.weatherapp",
      "buildNumber": "1.0.0"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "permissions": [
        "ACCESS_FINE_LOCATION"
      ],
      "package": "com.yourcompany.weatherapp",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "description": "A simple weather app built with React Native and Expo that shows current weather conditions based on your location.",
    "githubUrl": "https://github.com/yourusername/react-native-weather-app"
  }
}


package.json


{
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "eject": "expo eject"
  },
  "dependencies": {
    "expo": "~47.0.12",
    "expo-status-bar": "~1.4.2",
    "react": "18.1.0",
    "react-native": "0.70.5",
    "react-native-geolocation-service": "^5.3.1",
    "@expo/vector-icons": "^13.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.12.9"
  },
  "private": true
}


src/components/Weather.test.js


import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import Weather from './Weather';

// Mock the Geolocation service
jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn((successCallback) => {
    successCallback({
      coords: {
        latitude: 51.5074,
        longitude: -0.1278
      }
    });
  })
}));

// Mock the fetch function
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      main: { temp: 15 },
     It looks like you've shared the code for a React Native weather app. I notice there's an issue in the `src/components/Weather.js` file that could cause problems. Let me help you fix it.

The main issue is in the `fetchWeather` method where the error handling is not properly implemented. Here's the corrected version:

<dyad-write path="src/components/Weather.js" description="Fixing error handling in the fetchWeather method">
import React, { Component } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import WeatherCard from './WeatherCard';
import Loading from './Loading';
import LocationError from './LocationError';

const API_KEY = 'b714ec74bbab5650795063cb0fdf5fbe';

class Weather extends Component {
  state = {
    isLoading: true,
    temperature: 0,
    weatherCondition: null,
    error: null,
    city: null
  };

  componentDidMount() {
    if (Platform.OS === 'android') {
      this.requestLocationPermission();
    } else {
      this.getLocation();
    }
  }

  requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Weather App Location Permission',
          message:
            'Weather App needs access to your location ' +
            'so you can see the weather in your area.'
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        this.getLocation();
      } else {
        this.setState({
          isLoading: false,
          error: 'Location permission denied'
        });
      }
    } catch (err) {
      console.warn(err);
      this.setState({
        isLoading: false,
        error: 'Error requesting location permission'
      });
    }
  };

  getLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        this.fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      error => {
        console.log('Geolocation error:', error);
        this.setState({
          isLoading: false,
          error: 'Error getting location'
        });
      }
    );
  };

  fetchWeather = (lat, lon) => {
    fetch(
      `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    )
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then(json => {
        this.setState({
          temperature: json.main.temp,
          weatherCondition: json.weather[0].main,
          city: json.name,
          isLoading: false
        });
      })
      .catch(err => {
        console.log('Fetch error:', err);
        this.setState({
          isLoading: false,
          error: 'Error fetching weather data'
        });
      });
  };

  render() {
    const { isLoading, weatherCondition, temperature, error, city } = this.state;
    return (
      <>
        {isLoading ? (
          <Loading />
        ) : error ? (
          <LocationError />
        ) : (
          <WeatherCard
            weather={weatherCondition}
            temperature={Math.round(temperature)}
            city={city}
          />
        )}
      </>
    );
  }
}

export default Weather;