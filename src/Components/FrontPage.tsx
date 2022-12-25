import _ from 'lodash'
import { Button, ButtonContent, Card, CardContent, CardGroup, Container, Grid, Header, Icon, Image, Search } from "semantic-ui-react"
import 'semantic-ui-css/semantic.min.css'
import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import axios from "axios"
import { CITIES } from "./Cities"
import "./FrontPage.css"

interface City {
    title: string
    temperature: number
    description: string
    image: string
}

const emptySearch = {
    loading: false,
    results: [],
    value: ""
}

function searchReducer(state, action) {
    switch (action.type) {
        case 'CLEAN_QUERY':
            return emptySearch
        case 'START_SEARCH':
            return { ...state, loading: true, value: action.query, selected: false }
        case 'FINISH_SEARCH':
            return { ...state, loading: false, results: action.results }
        case 'UPDATE_SELECTION':
            return { ...state, value: action.selection, selected: true }
        default:
            throw new Error()
    }
}

export function FrontPage() {

    const [prognoza, setPrognoza] = useState<City[]>([])
    const [{ loading, results, value, selected }, dispatch] = useReducer(searchReducer, emptySearch)
    const timeout = useRef<ReturnType<typeof setTimeout>>()

    const handleSearchChange = useCallback((e, data) => {
        clearTimeout(timeout.current)
        dispatch({ type: 'START_SEARCH', query: data.value })

        timeout.current = setTimeout(() => {
            if (data.value.length === 0) {
                dispatch({ type: 'CLEAN_QUERY' })
                return
            }

            const re = new RegExp(_.escapeRegExp(data.value), 'i')
            const isMatch = (result) => re.test(result.title)

            dispatch({
                type: 'FINISH_SEARCH',
                results: prognoza.filter(isMatch),
            })
        }, 300)
    }, [prognoza])


    useEffect(() => {
        setPrognoza([])
        for (let city of CITIES) {
            const params = new URLSearchParams({
                "key": process.env.REACT_APP_API_KEY as string,
                "q": city
            })

            axios.get("http://api.weatherapi.com/v1/current.json?", {
                headers: {
                    "Content-Type": "json"
                },
                params: params

            })
                .then(response => response.data)
                .then(data => setPrognoza(prognoza => [...prognoza, {
                    title: city,
                    temperature: data.current.temp_c,
                    description: data.current.condition.text,
                    image: data.current.condition.icon
                } as City]))
        }
    }, [])

    return <>
        <Header>
            <Header.Content content="Weather App" />
        </Header>
        <div className="search-bar">
            <Search
                loading={loading}
                placeholder="Search city..."
                onResultSelect={(_, data) => dispatch({ type: 'UPDATE_SELECTION', selection: data.result })}
                onSearchChange={handleSearchChange}
                results={results}
                value={value.title}
            />
            <Button floated='right' icon={"trash alternate"} onClick={() => dispatch({ type: 'CLEAN_QUERY' })}/>
        </div>
        <Container>
            {selected &&
                <Card color='teal'>
                    <Card.Content>
                        <Image floated="right" src={value.image} />
                        <Card.Header>{value.title}</Card.Header>
                        <Card.Meta>{`${value.temperature}°C`}</Card.Meta>
                        <Card.Description>{value.description}</Card.Description>
                    </Card.Content>
                </Card>}
            {!selected &&
                <CardGroup itemsPerRow={3}>
                    {prognoza.map((city, id) =>
                        <Card fluid color='teal'
                            className="city"
                            key={id}
                            onClick={() => {
                                dispatch({ type: 'UPDATE_SELECTION', selection: prognoza.find(c => c.title === city.title) })
                            }}>
                            <Card.Content>
                                <Image floated="right" src={city.image} />
                                <Card.Header>{city.title}</Card.Header>
                                <Card.Meta>{`${city.temperature}°C`}</Card.Meta>
                                <Card.Description>{city.description}</Card.Description>
                            </Card.Content>
                        </Card>)}
                </CardGroup>
            }
        </Container>
    </>
}