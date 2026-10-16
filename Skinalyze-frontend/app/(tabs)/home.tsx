import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Dimensions,
    Modal,
} from "react-native";
import Svg, { Path, Line } from "react-native-svg";

export default function App() {
    const [profiles, setProfiles] = useState([
        {
            id: 1,
            name: "Swarup",
            type: "Human",
            score: 87,
            history: [40, 55, 60, 80, 90],
        },
        {
            id: 2,
            name: "Bruno",
            type: "Dog",
            avatar: "🐶",
            score: 72,
            history: [30, 45, 50, 60],
        },
    ]);

    const [activeProfileId, setActiveProfileId] = useState(1);
    const [modalVisible, setModalVisible] = useState(false);
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState("");

    const activeProfile = profiles.find((p) => p.id === activeProfileId);

    const addProfile = () => {
        if (newName.trim() === "") return;

        const newProfile = {
            id: Date.now(),
            name: newName,
            type: newType || "Human",
            avatar: "🙂",
            score: 0,
            history: [],
        };

        setProfiles([...profiles, newProfile]);
        setModalVisible(false);
        setNewName("");
        setNewType("");
    };

    // Graph Setup
    const data = activeProfile.history.length > 0 ? activeProfile.history : [0];
    const width = Dimensions.get("window").width - 40;
    const height = 180;
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);

    const points = data
        .map((value, index) => {
            const x = (index / (data.length - 1 || 1)) * width;
            const y =
                height - ((value - minValue) / (maxValue - minValue || 1)) * height;
            return `${x},${y}`;
        })
        .join(" ");

    const pathData = `M${points.replace(/ /g, " L")}`;

    return (
        <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>

            {/* HERO SECTION */}
            <View
                style={{
                    backgroundColor: "#A020F0",
                    padding: 25,
                    paddingTop: 50,
                    borderBottomLeftRadius: 30,
                    borderBottomRightRadius: 30,
                }}
            >
                <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700" }}>
                    Welcome Back, {activeProfile.name} 👋
                </Text>
                <Text style={{ color: "#eee", marginTop: 6, fontSize: 15 }}>
                    Keep track of your skin health with smart insights.
                </Text>
            </View>

            {/* PROFILE SWITCHER (OLD UI) */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ paddingVertical: 15, paddingLeft: 15 }}
            >
                {profiles.map((profile) => (
                    <TouchableOpacity
                        key={profile.id}
                        onPress={() => setActiveProfileId(profile.id)}
                        style={{
                            paddingVertical: 10,
                            paddingHorizontal: 18,
                            backgroundColor:
                                profile.id === activeProfileId ? "#A020F0" : "#eee",
                            marginRight: 10,
                            borderRadius: 20,
                        }}
                    >
                        <Text
                            style={{
                                color: profile.id === activeProfileId ? "#fff" : "#444",
                                fontWeight: "600",
                            }}
                        >
                            {profile.avatar} {profile.name}
                        </Text>
                    </TouchableOpacity>
                ))}

                {/* ADD PROFILE BUTTON */}
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    style={{
                        paddingVertical: 10,
                        paddingHorizontal: 18,
                        backgroundColor: "#ddd",
                        borderRadius: 20,
                    }}
                >
                    <Text style={{ color: "#444", fontWeight: "600" }}>➕ Add</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* QUICK ACTIONS */}
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginHorizontal: 20,
                    marginTop: -5,
                }}
            >
                <TouchableOpacity
                    style={{
                        backgroundColor: "#fff",
                        padding: 20,
                        width: "48%",
                        borderRadius: 20,
                        shadowColor: "#000",
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 5,
                    }}
                >
                    <Text style={{ fontSize: 18, fontWeight: "700" }}>📸 Scan Now</Text>
                    <Text style={{ color: "#666", marginTop: 4 }}>New skin scan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{
                        backgroundColor: "#fff",
                        padding: 20,
                        width: "48%",
                        borderRadius: 20,
                        shadowColor: "#000",
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 5,
                    }}
                >
                    <Text style={{ fontSize: 18, fontWeight: "700" }}>🧑‍🤝‍🧑 Profiles</Text>
                    <Text style={{ color: "#666", marginTop: 4 }}>
                        Switch or add profile
                    </Text>
                </TouchableOpacity>
            </View>

            {/* SCORE CARD */}
            <View
                style={{
                    margin: 20,
                    padding: 20,
                    backgroundColor: "#f6edff",
                    borderRadius: 16,
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    elevation: 3,
                }}
            >
                <Text style={{ fontSize: 18, fontWeight: "600", color: "#A020F0" }}>
                    {activeProfile.name}'s Skin Score
                </Text>

                <Text style={{ fontSize: 40, fontWeight: "800", marginTop: 10 }}>
                    {activeProfile.score}/100
                </Text>

                <Text style={{ color: "#666", marginTop: 4 }}>
                    {activeProfile.score > 70
                        ? "Great condition!"
                        : "Needs little improvement."}
                </Text>
            </View>

            {/* HEALTH TREND */}
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                <Text
                    style={{
                        fontSize: 20,
                        fontWeight: "700",
                        marginBottom: 10,
                        color: "#A020F0",
                    }}
                >
                    Health Trend
                </Text>

                <Svg height={height} width={width}>
                    {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                        <Line
                            key={i}
                            x1="0"
                            y1={height * t}
                            x2={width}
                            y2={height * t}
                            stroke="#eee"
                            strokeWidth="1"
                        />
                    ))}

                    <Path d={pathData} fill="none" stroke="#A020F0" strokeWidth="3" />
                </Svg>
            </View>

            {/* DAILY TIP */}
            <View
                style={{
                    marginHorizontal: 20,
                    marginBottom: 30,
                    padding: 20,
                    backgroundColor: "#fff8e7",
                    borderRadius: 16,
                    borderLeftWidth: 5,
                    borderLeftColor: "#FFC107",
                }}
            >
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#ff9800" }}>
                    🌟 Today's Skin Tip
                </Text>
                <Text style={{ color: "#444", marginTop: 5 }}>
                    Drink plenty of water and avoid touching your face frequently.
                </Text>
            </View>
        </ScrollView>
    );

}