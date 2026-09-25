Pod::Spec.new do |s|
  s.name           = 'BesLiveActivity'
  s.version        = '1.0.0'
  s.summary        = 'BES Live Activity (ActivityKit) bridge'
  s.description    = 'Starts, updates and ends the BES prayer countdown Live Activity.'
  s.author         = 'KUS GRUP GAMES'
  s.homepage       = 'https://kusgrupgames.github.io'
  s.license        = { :type => 'Proprietary' }
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files   = '**/*.swift'
  s.swift_version  = '5.9'
end
